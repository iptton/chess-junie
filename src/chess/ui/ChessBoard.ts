import { Game } from '../models/Game';
import { Piece, PieceColor, PieceType, Position, GameStatus } from '../models/types';

export class ChessBoard {
  private game: Game;
  private boardElement: HTMLElement;
  private selectedCell: Position | null = null;
  private possibleMoves: Position[] = [];

  constructor(containerId: string) {
    this.game = new Game();
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    this.boardElement = document.createElement('div');
    this.boardElement.className = 'chess-board';
    container.appendChild(this.boardElement);
    
    this.render();
  }

  private render(): void {
    this.boardElement.innerHTML = '';
    
    // Create the board cells
    for (let y = 7; y >= 0; y--) {
      for (let x = 0; x < 8; x++) {
        const cell = document.createElement('div');
        cell.className = 'chess-cell';
        cell.classList.add((x + y) % 2 === 0 ? 'light' : 'dark');
        
        // Add coordinates as data attributes
        cell.dataset.x = x.toString();
        cell.dataset.y = y.toString();
        
        // Add click event listener
        cell.addEventListener('click', () => this.handleCellClick({ x, y }));
        
        // Highlight selected cell
        if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
          cell.classList.add('selected');
        }
        
        // Highlight possible moves
        if (this.possibleMoves.some(pos => pos.x === x && pos.y === y)) {
          cell.classList.add('possible-move');
        }
        
        // Add piece if present
        const piece = this.game.getBoard().getPieceAt({ x, y });
        if (piece) {
          const pieceElement = this.createPieceElement(piece);
          cell.appendChild(pieceElement);
        }
        
        this.boardElement.appendChild(cell);
      }
    }
    
    // Add status display
    const status = document.createElement('div');
    status.className = 'game-status';
    
    const currentPlayer = this.game.getCurrentPlayer() === PieceColor.WHITE ? 'White' : 'Black';
    const gameStatus = this.game.getStatus();
    
    let statusText = `Current player: ${currentPlayer}`;
    
    if (gameStatus === GameStatus.CHECK) {
      statusText += ' (Check)';
    } else if (gameStatus === GameStatus.CHECKMATE) {
      statusText = `Game over: ${currentPlayer === 'White' ? 'Black' : 'White'} wins by checkmate!`;
    } else if (gameStatus === GameStatus.STALEMATE) {
      statusText = 'Game over: Draw by stalemate!';
    } else if (gameStatus === GameStatus.DRAW) {
      statusText = 'Game over: Draw!';
    }
    
    status.textContent = statusText;
    this.boardElement.parentElement?.appendChild(status);
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Game';
    resetButton.addEventListener('click', () => this.resetGame());
    this.boardElement.parentElement?.appendChild(resetButton);
  }

  private createPieceElement(piece: Piece): HTMLElement {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'chess-piece';
    pieceElement.classList.add(piece.color.toLowerCase());
    
    // Add piece type as class
    pieceElement.classList.add(piece.type.toLowerCase());
    
    // Use Unicode chess symbols
    let symbol = '';
    switch (piece.type) {
      case PieceType.KING:
        symbol = piece.color === PieceColor.WHITE ? '♔' : '♚';
        break;
      case PieceType.QUEEN:
        symbol = piece.color === PieceColor.WHITE ? '♕' : '♛';
        break;
      case PieceType.ROOK:
        symbol = piece.color === PieceColor.WHITE ? '♖' : '♜';
        break;
      case PieceType.BISHOP:
        symbol = piece.color === PieceColor.WHITE ? '♗' : '♝';
        break;
      case PieceType.KNIGHT:
        symbol = piece.color === PieceColor.WHITE ? '♘' : '♞';
        break;
      case PieceType.PAWN:
        symbol = piece.color === PieceColor.WHITE ? '♙' : '♟';
        break;
    }
    
    pieceElement.textContent = symbol;
    return pieceElement;
  }

  private handleCellClick(position: Position): void {
    // If game is over, do nothing
    if (this.game.getStatus() === GameStatus.CHECKMATE || 
        this.game.getStatus() === GameStatus.STALEMATE || 
        this.game.getStatus() === GameStatus.DRAW) {
      return;
    }
    
    const piece = this.game.getBoard().getPieceAt(position);
    
    // If no cell is selected and the clicked cell has a piece of the current player, select it
    if (!this.selectedCell && piece && piece.color === this.game.getCurrentPlayer()) {
      this.selectedCell = position;
      this.possibleMoves = this.game.getPossibleMoves(position);
      this.render();
      return;
    }
    
    // If a cell is already selected
    if (this.selectedCell) {
      // If the clicked cell is a possible move, make the move
      if (this.possibleMoves.some(pos => pos.x === position.x && pos.y === position.y)) {
        this.game.makeMove(this.selectedCell, position);
        this.selectedCell = null;
        this.possibleMoves = [];
        this.render();
        return;
      }
      
      // If the clicked cell has a piece of the current player, select it
      if (piece && piece.color === this.game.getCurrentPlayer()) {
        this.selectedCell = position;
        this.possibleMoves = this.game.getPossibleMoves(position);
        this.render();
        return;
      }
      
      // Otherwise, deselect the current cell
      this.selectedCell = null;
      this.possibleMoves = [];
      this.render();
    }
  }

  private resetGame(): void {
    this.game.resetGame();
    this.selectedCell = null;
    this.possibleMoves = [];
    this.render();
  }
}