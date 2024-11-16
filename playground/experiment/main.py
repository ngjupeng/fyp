import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt


class TurbofanDataset(Dataset):
    def __init__(self, data, sequence_length=50):
        self.sequence_length = sequence_length

        # Extract features (sensor measurements and operational settings)
        self.features = data[:, 2:26].astype(float)  # columns 3-26

        # Calculate RUL for training data
        max_cycles = pd.DataFrame(data[:, :2].astype(int)).groupby(0)[1].max()
        rul = (
            pd.DataFrame(data[:, :2].astype(int))
            .groupby(0)[1]
            .transform(lambda x: max_cycles[x.name] - x)
        )
        self.targets = rul.values.reshape(-1, 1)

        # Normalize features
        self.scaler = StandardScaler()
        self.features = self.scaler.fit_transform(self.features)

        # Prepare sequences
        self.prepare_sequences()

    def prepare_sequences(self):
        # Group by engine unit
        df = pd.DataFrame(np.hstack((self.features, self.targets)))
        engine_groups = df.groupby(df.index // self.sequence_length)

        sequences = []
        targets = []

        for _, group in engine_groups:
            if len(group) >= self.sequence_length:
                sequences.append(group.iloc[: self.sequence_length, :-1].values)
                targets.append(group.iloc[self.sequence_length - 1, -1])

        self.sequences = torch.FloatTensor(np.array(sequences))
        self.targets = torch.FloatTensor(np.array(targets))

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]


class Predictor(nn.Module):
    def __init__(self, input_size=24, hidden_size=50):
        super(Predictor, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 24),
            nn.ReLU(),
            nn.Linear(24, 24),
            nn.ReLU(),
            nn.Linear(24, 24),
            nn.ReLU(),
            nn.Linear(24, 1),
        )

    def forward(self, x):
        return self.layers(x)


def train_model(model, train_loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    for sequences, targets in train_loader:
        sequences, targets = sequences.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(sequences)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    return total_loss / len(train_loader)


def federated_training(
    models, train_loaders, test_loader, num_rounds=10, device="cuda"
):
    losses = []

    for round in range(num_rounds):
        # Local training
        local_weights = []
        for i in range(len(models)):
            optimizer = torch.optim.Adam(models[i].parameters())
            criterion = nn.MSELoss()
            train_loss = train_model(
                models[i], train_loaders[i], criterion, optimizer, device
            )
            local_weights.append([param.data for param in models[i].parameters()])

        # Aggregate weights (FedAvg)
        averaged_weights = []
        for param_idx in range(len(local_weights[0])):
            averaged_weights.append(
                sum(weights[param_idx] for weights in local_weights)
                / len(local_weights)
            )

        # Update all models with averaged weights
        for model in models:
            for param, avg_weight in zip(model.parameters(), averaged_weights):
                param.data = avg_weight.clone()

        # Evaluate
        test_loss = evaluate_model(models[0], test_loader, device)
        losses.append(test_loss)
        print(f"Round {round+1}, Test Loss: {test_loss:.4f}")

    return losses


def evaluate_model(model, test_loader, device):
    model.eval()
    criterion = nn.MSELoss()
    total_loss = 0
    with torch.no_grad():
        for sequences, targets in test_loader:
            sequences, targets = sequences.to(device), targets.to(device)
            outputs = model(sequences)
            loss = criterion(outputs, targets)
            total_loss += loss.item()
    return total_loss / len(test_loader)


def main():
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load data
    train_data = np.loadtxt("./CMAPSSData/train_FD001.txt")
    test_data = np.loadtxt("./CMAPSSData/test_FD001.txt")

    # Create datasets
    train_dataset = TurbofanDataset(train_data)
    test_dataset = TurbofanDataset(test_data)

    print(train_dataset)

    # Single node training
    print("Single Node Training:")
    single_model = Predictor().to(device)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32)

    optimizer = torch.optim.Adam(single_model.parameters())
    criterion = nn.MSELoss()
    single_losses = []

    for epoch in range(10):
        train_loss = train_model(
            single_model, train_loader, criterion, optimizer, device
        )
        test_loss = evaluate_model(single_model, test_loader, device)
        single_losses.append(test_loss)
        print(f"Epoch {epoch+1}, Test Loss: {test_loss:.4f}")

    # Federated training with 3 participants
    # print("\nFederated Training (3 participants):")
    # num_participants = 3
    # fed_models = [LSTMPredictor().to(device) for _ in range(num_participants)]

    # # Split dataset among participants
    # dataset_splits = np.array_split(range(len(train_dataset)), num_participants)
    # fed_datasets = [
    #     torch.utils.data.Subset(train_dataset, indices) for indices in dataset_splits
    # ]
    # fed_loaders = [DataLoader(ds, batch_size=32, shuffle=True) for ds in fed_datasets]

    # fed_losses_3 = federated_training(
    #     fed_models, fed_loaders, test_loader, device=device
    # )

    # # Federated training with 5 participants
    # print("\nFederated Training (5 participants):")
    # num_participants = 5
    # fed_models = [LSTMPredictor().to(device) for _ in range(num_participants)]

    # dataset_splits = np.array_split(range(len(train_dataset)), num_participants)
    # fed_datasets = [
    #     torch.utils.data.Subset(train_dataset, indices) for indices in dataset_splits
    # ]
    # fed_loaders = [DataLoader(ds, batch_size=32, shuffle=True) for ds in fed_datasets]

    # fed_losses_5 = federated_training(
    #     fed_models, fed_loaders, test_loader, device=device
    # )

    # # Plot results
    # plt.figure(figsize=(10, 6))
    # plt.plot(single_losses, label="Single Node")
    # plt.plot(fed_losses_3, label="Federated (3 participants)")
    # plt.plot(fed_losses_5, label="Federated (5 participants)")
    # plt.xlabel("Epoch/Round")
    # plt.ylabel("Test Loss (MSE)")
    # plt.title("Model Performance Comparison")
    # plt.legend()
    # plt.savefig("performance_comparison.png")
    # plt.close()


if __name__ == "__main__":
    main()
