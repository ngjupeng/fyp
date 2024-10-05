try {
    npm run docker:db:test:up
    jest --config ./test/jest-e2e.json --runInBand
}
finally {
    npm run docker:db:test:down
}
