import { Game, GameMode } from '../models/Game';
import { Piece, PieceColor, PieceType, Position, GameStatus } from '../models/types';

export class ChessBoard {
  private game: Game;
  private boardElement: HTMLElement;
  private statusElement: HTMLElement;
  private resetButton: HTMLButtonElement;
  private gameModeSelect: HTMLSelectElement;
  private aiColorSelect: HTMLSelectElement;
  private aiThinkingIndicator: HTMLElement;
  private selectedCell: Position | null = null;
  private possibleMoves: Position[] = [];
  private aiThinkingTimer: number | null = null;

  constructor(containerId: string) {
    this.game = new Game();

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'chess-controls';
    container.appendChild(controlsContainer);

    // Create game mode selector
    const gameModeLabel = document.createElement('label');
    gameModeLabel.textContent = 'Game Mode: ';
    controlsContainer.appendChild(gameModeLabel);

    this.gameModeSelect = document.createElement('select');

    const humanVsHumanOption = document.createElement('option');
    humanVsHumanOption.value = GameMode.HUMAN_VS_HUMAN;
    humanVsHumanOption.textContent = 'Human vs. Human';
    this.gameModeSelect.appendChild(humanVsHumanOption);

    const humanVsAIOption = document.createElement('option');
    humanVsAIOption.value = GameMode.HUMAN_VS_AI;
    humanVsAIOption.textContent = 'Human vs. AI';
    this.gameModeSelect.appendChild(humanVsAIOption);

    this.gameModeSelect.addEventListener('change', () => this.handleGameModeChange());
    gameModeLabel.appendChild(this.gameModeSelect);

    // Create AI color selector (initially hidden)
    const aiColorContainer = document.createElement('div');
    aiColorContainer.id = 'ai-color-container';
    aiColorContainer.style.display = 'none';
    controlsContainer.appendChild(aiColorContainer);

    const aiColorLabel = document.createElement('label');
    aiColorLabel.textContent = 'AI Color: ';
    aiColorContainer.appendChild(aiColorLabel);

    this.aiColorSelect = document.createElement('select');

    const aiWhiteOption = document.createElement('option');
    aiWhiteOption.value = PieceColor.WHITE;
    aiWhiteOption.textContent = 'White';
    this.aiColorSelect.appendChild(aiWhiteOption);

    const aiBlackOption = document.createElement('option');
    aiBlackOption.value = PieceColor.BLACK;
    aiBlackOption.textContent = 'Black';
    this.aiColorSelect.appendChild(aiBlackOption);
    this.aiColorSelect.value = PieceColor.BLACK; // Default AI color is black

    this.aiColorSelect.addEventListener('change', () => this.handleAIColorChange());
    aiColorLabel.appendChild(this.aiColorSelect);

    // Create AI thinking indicator
    this.aiThinkingIndicator = document.createElement('div');
    this.aiThinkingIndicator.className = 'ai-thinking';
    this.aiThinkingIndicator.textContent = 'AI is thinking...';
    this.aiThinkingIndicator.style.display = 'none';
    controlsContainer.appendChild(this.aiThinkingIndicator);

    this.boardElement = document.createElement('div');
    this.boardElement.className = 'chess-board';
    container.appendChild(this.boardElement);

    // Create status element once
    this.statusElement = document.createElement('div');
    this.statusElement.className = 'game-status';
    container.appendChild(this.statusElement);

    // Create reset button once
    this.resetButton = document.createElement('button');
    this.resetButton.textContent = 'Reset Game';
    this.resetButton.addEventListener('click', () => this.resetGame());
    container.appendChild(this.resetButton);

    this.render();
  }

  private handleGameModeChange(): void {
    const gameMode = this.gameModeSelect.value as GameMode;
    const aiColor = this.aiColorSelect.value as PieceColor;

    // Show/hide AI color selector
    const aiColorContainer = document.getElementById('ai-color-container');
    if (aiColorContainer) {
      aiColorContainer.style.display = gameMode === GameMode.HUMAN_VS_AI ? 'block' : 'none';
    }

    // Update game mode
    this.game.setGameMode(gameMode, aiColor);
    this.render();
  }

  private handleAIColorChange(): void {
    const gameMode = this.gameModeSelect.value as GameMode;
    const aiColor = this.aiColorSelect.value as PieceColor;

    // Only update if in AI mode
    if (gameMode === GameMode.HUMAN_VS_AI) {
      this.game.setGameMode(gameMode, aiColor);
      this.render();
    }
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

    // Update status display
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

    // Add game mode info
    const gameMode = this.game.getGameMode();
    if (gameMode === GameMode.HUMAN_VS_AI) {
      const aiColor = this.game.getAIColor() === PieceColor.WHITE ? 'White' : 'Black';
      statusText += ` | AI playing as: ${aiColor}`;
    }

    this.statusElement.textContent = statusText;

    // Update AI thinking indicator
    this.updateAIThinkingIndicator();
  }

  private updateAIThinkingIndicator(): void {
    // Check if AI is thinking
    if (this.game.getGameMode() === GameMode.HUMAN_VS_AI && this.game.isAIThinking()) {
      this.aiThinkingIndicator.style.display = 'block';

      // Add animated dots
      if (this.aiThinkingTimer === null) {
        let dots = 0;
        this.aiThinkingTimer = window.setInterval(() => {
          dots = (dots + 1) % 4;
          this.aiThinkingIndicator.textContent = 'AI is thinking' + '.'.repeat(dots);
        }, 500);
      }
    } else {
      this.aiThinkingIndicator.style.display = 'none';

      // Clear animation timer
      if (this.aiThinkingTimer !== null) {
        window.clearInterval(this.aiThinkingTimer);
        this.aiThinkingTimer = null;
      }
    }
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

    // If AI is thinking, do nothing
    if (this.game.isAIThinking()) {
      return;
    }

    // In AI mode, if it's AI's turn, do nothing
    if (this.game.getGameMode() === GameMode.HUMAN_VS_AI && 
        this.game.getCurrentPlayer() === this.game.getAIColor()) {
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

        // After human move, update AI thinking indicator in case AI is now thinking
        this.updateAIThinkingIndicator();
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
    // Preserve current game mode and AI color when resetting
    const gameMode = this.game.getGameMode();
    const aiColor = this.game.getAIColor();

    this.game.resetGame();

    // Restore game mode and AI color
    if (gameMode === GameMode.HUMAN_VS_AI) {
      this.game.setGameMode(gameMode, aiColor);
    }

    this.selectedCell = null;
    this.possibleMoves = [];
    this.render();
  }
}
