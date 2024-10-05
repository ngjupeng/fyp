import { IBase } from './base';
import { TokenType } from '../enums/token';

export interface IToken extends IBase {
  uuid: string;
  tokenType: TokenType;
}
