import { Piece, Position, Move } from './types';

export interface BoardInterface {
  getPieces(): Piece[];
  getPieceAt(position: Position): Piece | undefined;
  movePiece(from: Position, to: Position): Move | null;
  updatePiecePosition(from: Position, to: Position): void;
  removePiece(position: Position): void;
  resetBoard(): void;
  setPieces(pieces: Piece[]): void;
}
