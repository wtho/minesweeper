import * as React from 'react';

const numberColors = {
  0: '',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight'
}

interface IMineSweeperStateProps {
  gameStatus: string;
  rows: number;
  columns: number;
  mines: number;
  mineField: IMineField[][];
}

interface IMineField {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  mineCounter: number | null;
}

interface IMineSweeperProps {
  rows: number,
  columns: number,
  mines: number,
}

export default class MineSweeper extends React.Component<IMineSweeperProps, IMineSweeperStateProps> {
  constructor(props: IMineSweeperProps) {
    super(props)
    this.state = {
      gameStatus: "0_0",
      rows: this.props.rows,
      columns: this.props.columns,
      mines: this.props.mines,
      mineField: this.generateMineField(this.props.rows, this.props.columns, this.props.mines)
    }
  }

  public gameOver() {
    this.setState({ gameStatus: "X_X" });
    this.revealAllMines();
    console.log("GAMEOVER", this.state.mineField)
  }

  public render() {
    const grid = this.state.mineField.map((row: any, i: any) => {
      const cells = row.map((_: any, j: any) => {
        const mine = this.state.mineField[i][j];
        const isRevealed = mine.isRevealed;
        const isFlagged = mine.isFlagged;
        const isRevealedMine = mine.isRevealed && mine.isMine;
        const flagged = isFlagged ? " flagged" : "";
        const revealed = isRevealed ? " revealed" : "";
        const revealedMine = isRevealedMine ? " mine" : "";
        const num = isRevealed && mine.mineCounter ? numberColors[mine.mineCounter] : '';
        const mineCounter = mine.mineCounter && mine.mineCounter > 0 ? mine.mineCounter : '';
        return <div
          key={`cell-${i}-${j}`}
          className={`grid-cell${revealed}${revealedMine}${flagged} ${num}`}
          onClick={(e) => this.cellClickedHandler(e, i, j)}
        >{mineCounter}</div>
      });
      return <div key={`row-${i}`} className="grid-row">{cells}</div>
    });

    const flagCounter = this.state.mineField
      .reduce((acc: IMineField[], val: IMineField[]) => acc.concat(val), [])
      .filter((m: IMineField) => m.isFlagged && !m.isRevealed).length;
    const counter = this.props.mines - flagCounter;
    const counterText = counter < 10 ? `0${counter}` : `${counter}`;

    return (
      <div className="game-wrapper">
        <h1>Minesweeper</h1>
        <div className="mine-sweeper">
          <div className="game-state">
            <div className="counter">
              <span>{counterText}</span>
            </div>
            {this.state.gameStatus}
            <button onClick={() => this.resetGame()}>Reset</button>
          </div>
          <div className="grid">
            {grid}
          </div>
        </div>
      </div>
    );
  }

  private resetGame() {
    this.setState({
      gameStatus: "0_0",
      mineField: this.generateMineField(this.props.rows, this.props.columns, this.props.mines)
    })
  }

  private placeMinesOnField(mineField: IMineField[][], rows: number, columns: number, numberOfMines: number) {
    while (numberOfMines > 0) {
      const rowIdx = this.random(rows)
      const colIdx = this.random(columns)
      if (!mineField[rowIdx][colIdx].isMine) {
        mineField[rowIdx][colIdx].isMine = true
        numberOfMines--;
      }
    }
    return mineField;
  }

  private random = (num: number): number => Math.floor(Math.random() * num);

  private toMineField = (): IMineField => ({
    isMine: false,
    isFlagged: false,
    isRevealed: false,
    mineCounter: null // If its a mine the counter will remain null
  });

  private createEmptyField = (rows: number, columns: number) =>
    Array(rows)
      .fill(0)
      .map(_ => Array(columns).fill(0).map(m => this.toMineField()))

  private generateMineField(rows: number, columns: number, mines: number) {
    return this.setMineCounters(
      this.placeMinesOnField(
        this.createEmptyField(rows, columns),
        rows,
        columns,
        mines
      )
    );
  }

  private cellClickedHandler(e: React.MouseEvent, x: number, y: number) {
    if (!e.shiftKey && this.isMine(x, y)) {
      this.gameOver();
    } else {
      e.shiftKey ? this.toggleFlagged(x, y) : this.revealCell(x, y);
    }
  }

  private isMine = (x: number, y: number): boolean => this.state.mineField[x][y].isMine

  private revealAllMines() {
    const mineField = this.state.mineField;
    mineField.map(row => row.map(field => {
      if (field.isMine) {
        field.isRevealed = true;
      }
    }));
    this.setState({
      mineField
    });
  }

  private toggleFlagged(x: number, y: number) {
    const mineField = this.state.mineField;
    if (!mineField[x][y].isRevealed) {
      mineField[x][y].isFlagged = !mineField[x][y].isFlagged
      this.setState({
        mineField
      });
    }
  }

  private revealCell(x: number, y: number) {
    const mineField = this.state.mineField;
    mineField[x][y].isRevealed = true;
    mineField[x][y].isFlagged = false;
    this.setState({
      mineField
    });
    this.checkSurroundingCells(x, y);
  }

  private getSurroundingCells(x: number, y: number) {
    return [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1]
    ];
  }

  private setMineCounters(mineField: IMineField[][]): IMineField[][] {
    return mineField
      .map((row, x) => row
        .map((field, y) => {
          return field.isMine
            ? field
            : {
              ...field,
              mineCounter: this.countSurroundingMines(x, y, mineField)
            }
        })
      );
  }

  private countSurroundingMines(x: number, y: number, mineField: IMineField[][]): number {
    let counter = 0;
    const surroundingCells = this.constructSurroundingCells(x, y)
    surroundingCells.forEach((pos: number[]) => {
      if (mineField[pos[0]][pos[1]].isMine) {
        counter++;
      }
    });
    return counter;
  }

  private constructSurroundingCells(x: number, y: number) {
    return this.getSurroundingCells(x, y).reduce((acc, val) =>
      val[0] < 0
        ? acc
        : val[1] < 0
          ? acc
          : val[0] >= this.props.rows
            ? acc
            : val[1] >= this.props.columns
              ? acc
              : [...acc, val]
      , []);
  }

  private checkSurroundingCells(x: number, y: number) {
    return this.constructSurroundingCells(x, y);
  }
}
