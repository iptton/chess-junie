export enum PieceType {
  PAWN = 'pawn',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  ROOK = 'rook',
  QUEEN = 'queen',
  KING = 'king'
}

export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

export interface Position {
  x: number; // 0-7 (a-h)
  y: number; // 0-7 (1-8)
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
  position: Position;
  hasMoved?: boolean; // Used for castling and pawn's first move
}

export interface Move {
  from: Position;
  to: Position;
  capturedPiece?: Piece;
  promotion?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export enum GameStatus {
  ACTIVE = 'active',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw'
}