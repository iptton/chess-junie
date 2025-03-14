import { Board } from './Board';
import { Piece, PieceType, PieceColor, Position } from './types';

export class MoveValidator {
  constructor(private board: Board) {}

  public isValidMove(from: Position, to: Position, currentPlayerColor: PieceColor): boolean {
    // Check if the positions are within the board
    if (!this.isWithinBoard(from) || !this.isWithinBoard(to)) {
      return false;
    }

    // Check if there is a piece at the 'from' position
    const piece = this.board.getPieceAt(from);
    if (!piece) {
      return false;
    }

    // Check if the piece belongs to the current player
    if (piece.color !== currentPlayerColor) {
      return false;
    }

    // Check if the destination has a piece of the same color
    const destinationPiece = this.board.getPieceAt(to);
    if (destinationPiece && destinationPiece.color === piece.color) {
      return false;
    }

    // Check if the move is valid for the specific piece type
    if (!this.isValidMoveForPiece(piece, to)) {
      return false;
    }

    // Check if the move would put or leave the king in check
    if (this.wouldBeInCheck(from, to, piece.color)) {
      return false;
    }

    return true;
  }

  private isWithinBoard(position: Position): boolean {
    return position.x >= 0 && position.x < 8 && position.y >= 0 && position.y < 8;
  }

  private isValidMoveForPiece(piece: Piece, to: Position): boolean {
    const from = piece.position;

    switch (piece.type) {
      case PieceType.PAWN:
        return this.isValidPawnMove(piece, to);
      case PieceType.KNIGHT:
        return this.isValidKnightMove(from, to);
      case PieceType.BISHOP:
        return this.isValidBishopMove(from, to);
      case PieceType.ROOK:
        return this.isValidRookMove(from, to);
      case PieceType.QUEEN:
        return this.isValidQueenMove(from, to);
      case PieceType.KING:
        return this.isValidKingMove(piece, to);
      default:
        return false;
    }
  }

  private isValidPawnMove(pawn: Piece, to: Position): boolean {
    const from = pawn.position;
    const direction = pawn.color === PieceColor.WHITE ? 1 : -1;
    const startingRow = pawn.color === PieceColor.WHITE ? 1 : 6;

    // Forward movement
    if (from.x === to.x) {
      // Single square forward
      if (to.y === from.y + direction) {
        return !this.board.getPieceAt(to);
      }

      // Double square forward from starting position
      if (from.y === startingRow && to.y === from.y + 2 * direction) {
        const intermediatePos = { x: from.x, y: from.y + direction };
        return !this.board.getPieceAt(intermediatePos) && !this.board.getPieceAt(to);
      }
    }

    // Diagonal capture
    if (Math.abs(to.x - from.x) === 1 && to.y === from.y + direction) {
      const pieceAtDestination = this.board.getPieceAt(to);

      // Regular capture
      if (pieceAtDestination && pieceAtDestination.color !== pawn.color) {
        return true;
      }

      // En passant
      const enPassantPos = { x: to.x, y: from.y };
      const enPassantPiece = this.board.getPieceAt(enPassantPos);

      if (enPassantPiece && 
          enPassantPiece.type === PieceType.PAWN && 
          enPassantPiece.color !== pawn.color) {
        return true;
      }
    }

    return false;
  }

  private isValidKnightMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
  }

  private isValidBishopMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Bishop moves diagonally
    if (dx !== dy) {
      return false;
    }

    // Check if the path is clear
    return this.isDiagonalPathClear(from, to);
  }

  private isValidRookMove(from: Position, to: Position): boolean {
    // Rook moves horizontally or vertically
    if (from.x !== to.x && from.y !== to.y) {
      return false;
    }

    // Check if the path is clear
    return this.isStraightPathClear(from, to);
  }

  private isValidQueenMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Queen moves like a rook or a bishop
    if (from.x === to.x || from.y === to.y) {
      return this.isStraightPathClear(from, to);
    } else if (dx === dy) {
      return this.isDiagonalPathClear(from, to);
    }

    return false;
  }

  private isValidKingMove(king: Piece, to: Position): boolean {
    const from = king.position;
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Regular king move (one square in any direction)
    if (dx <= 1 && dy <= 1) {
      return true;
    }

    // Castling
    if (dy === 0 && dx === 2 && !king.hasMoved) {
      const kingSideRookPos = { x: 7, y: from.y };
      const queenSideRookPos = { x: 0, y: from.y };

      // Kingside castling
      if (to.x > from.x) {
        const rook = this.board.getPieceAt(kingSideRookPos);
        if (!rook || rook.type !== PieceType.ROOK || rook.hasMoved) {
          return false;
        }

        // Check if the path is clear
        return this.isStraightPathClear(from, { x: kingSideRookPos.x - 1, y: from.y }) &&
               !this.isSquareUnderAttack({ x: from.x + 1, y: from.y }, king.color) &&
               !this.isSquareUnderAttack({ x: from.x + 2, y: from.y }, king.color);
      }

      // Queenside castling
      if (to.x < from.x) {
        const rook = this.board.getPieceAt(queenSideRookPos);
        if (!rook || rook.type !== PieceType.ROOK || rook.hasMoved) {
          return false;
        }

        // Check if the path is clear
        return this.isStraightPathClear(from, { x: queenSideRookPos.x + 1, y: from.y }) &&
               !this.isSquareUnderAttack({ x: from.x - 1, y: from.y }, king.color) &&
               !this.isSquareUnderAttack({ x: from.x - 2, y: from.y }, king.color);
      }
    }

    return false;
  }

  private isStraightPathClear(from: Position, to: Position): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine the direction of movement
    const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    let currentX = from.x + stepX;
    let currentY = from.y + stepY;

    // Check each square along the path
    while (currentX !== to.x || currentY !== to.y) {
      if (this.board.getPieceAt({ x: currentX, y: currentY })) {
        return false;
      }

      currentX += stepX;
      currentY += stepY;
    }

    return true;
  }

  private isDiagonalPathClear(from: Position, to: Position): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine the direction of movement
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;

    let currentX = from.x + stepX;
    let currentY = from.y + stepY;

    // Check each square along the path
    while (currentX !== to.x && currentY !== to.y) {
      if (this.board.getPieceAt({ x: currentX, y: currentY })) {
        return false;
      }

      currentX += stepX;
      currentY += stepY;
    }

    return true;
  }

  public isInCheck(kingColor: PieceColor): boolean {
    // Find the king
    const pieces = this.board.getPieces();
    const king = pieces.find(p => p.type === PieceType.KING && p.color === kingColor);

    if (!king) {
      return false; // This shouldn't happen in a valid game
    }

    return this.isSquareUnderAttack(king.position, kingColor);
  }

  private isSquareUnderAttack(position: Position, defendingColor: PieceColor): boolean {
    const attackingColor = defendingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    const pieces = this.board.getPieces();

    // Check if any opponent piece can move to the given position
    for (const piece of pieces) {
      if (piece.color === attackingColor) {
        if (this.canPieceAttackSquare(piece, position)) {
          return true;
        }
      }
    }

    return false;
  }

  private canPieceAttackSquare(piece: Piece, position: Position): boolean {
    switch (piece.type) {
      case PieceType.PAWN:
        return this.canPawnAttackSquare(piece, position);
      case PieceType.KNIGHT:
        return this.isValidKnightMove(piece.position, position);
      case PieceType.BISHOP:
        return this.isValidBishopMove(piece.position, position) && 
               this.isDiagonalPathClear(piece.position, position);
      case PieceType.ROOK:
        return this.isValidRookMove(piece.position, position) && 
               this.isStraightPathClear(piece.position, position);
      case PieceType.QUEEN:
        return this.isValidQueenMove(piece.position, position) && 
               (this.isStraightPathClear(piece.position, position) || 
                this.isDiagonalPathClear(piece.position, position));
      case PieceType.KING:
        const dx = Math.abs(position.x - piece.position.x);
        const dy = Math.abs(position.y - piece.position.y);
        return dx <= 1 && dy <= 1;
      default:
        return false;
    }
  }

  private canPawnAttackSquare(pawn: Piece, position: Position): boolean {
    const from = pawn.position;
    const direction = pawn.color === PieceColor.WHITE ? 1 : -1;

    // Pawns attack diagonally
    return Math.abs(position.x - from.x) === 1 && position.y - from.y === direction;
  }

  private wouldBeInCheck(from: Position, to: Position, kingColor: PieceColor): boolean {
    // Create a temporary copy of the board to simulate the move
    const tempBoard = new Board();

    // Copy all pieces to the temporary board
    const pieces = this.board.getPieces();
    for (const piece of pieces) {
      tempBoard.movePiece(piece.position, piece.position);
    }

    // Make the move on the temporary board
    tempBoard.movePiece(from, to);

    // Check if the king is in check after the move
    const tempValidator = new MoveValidator(tempBoard);
    return tempValidator.isInCheck(kingColor);
  }

  public isCheckmate(kingColor: PieceColor): boolean {
    if (!this.isInCheck(kingColor)) {
      return false;
    }

    // Check if any move can get the king out of check
    const pieces = this.board.getPieces().filter(p => p.color === kingColor);

    for (const piece of pieces) {
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const to = { x, y };
          if (this.isValidMove(piece.position, to, kingColor)) {
            return false;
          }
        }
      }
    }

    return true;
  }
}
