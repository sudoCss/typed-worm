import readline from "readline";

const GAME_TIME_INTERVAL = 1000 / 60; // fps

const NEW_FOOD_INTERVAL = 2000;

const MOVE_INTERVAL = 100;

const MAX_FOOD_COUNT = 3;

const enum GAME_STATES {
    waiting,
    playing,
    over,
}

const enum KEYS {
    escape = "escape",
    spaceBar = "space",
    left = "left",
    right = "right",
    up = "up",
    down = "down",
}

const enum BLOCKS {
    wall = "🧱",
    playerHead = "😎",
    playerTail = "🟢",
    food = "🐦",
    empty = "  ",
}

const enum PLAYER_DIRECTIONS {
    left = "left",
    right = "right",
    up = "up",
    down = "down",
}

const GAME_SIZE = {
    width: 30,
    height: 20,
} as const;

interface Entity {
    x: number;
    y: number;
}

let gameState = GAME_STATES.waiting;
let playerDirection = PLAYER_DIRECTIONS.left;

let player: Entity[];
let foods: [Entity?, Entity?, Entity?];
let score: number;
let timeSinceLastFood: number;
let timeSinceLastMove: number;

registerKeyListener();

initGame();

startGame();

function registerKeyListener(): void {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (_str, key) => {
        if (key.ctrl && key.name === "c") {
            process.exit(0);
        }
        handleInput(key.name);
    });
}

function handleInput(key: string): void {
    if (gameState === GAME_STATES.playing) {
        switch (key) {
            case KEYS.left:
                if (playerDirection !== PLAYER_DIRECTIONS.right)
                    playerDirection = PLAYER_DIRECTIONS.left;
                break;
            case KEYS.right:
                if (playerDirection !== PLAYER_DIRECTIONS.left)
                    playerDirection = PLAYER_DIRECTIONS.right;
                break;
            case KEYS.up:
                if (playerDirection !== PLAYER_DIRECTIONS.down)
                    playerDirection = PLAYER_DIRECTIONS.up;
                break;
            case KEYS.down:
                if (playerDirection !== PLAYER_DIRECTIONS.up)
                    playerDirection = PLAYER_DIRECTIONS.down;
                break;
            default:
                break;
        }
    } else {
        if (key === KEYS.spaceBar) {
            initGame();
            gameState = GAME_STATES.playing;
        } else if (key === KEYS.escape) {
            process.exit(0);
        }
    }
}

function initGame(): void {
    player = [];
    player.push({
        x: Math.round(GAME_SIZE.width / 2),
        y: Math.round(GAME_SIZE.height / 2),
    });

    score = 0;
    foods = [];
    timeSinceLastFood = 0;
    timeSinceLastMove = 0;

    playerDirection = PLAYER_DIRECTIONS.left;
}

function startGame(): void {
    let lastUpdate = new Date().getTime();
    setInterval(() => {
        const currentUpdate = new Date().getTime();
        const delta = currentUpdate - lastUpdate;
        lastUpdate = currentUpdate;

        update(delta);
        draw();
    }, GAME_TIME_INTERVAL);
}

function update(delta: number): void {
    if (gameState !== GAME_STATES.playing) return;

    timeSinceLastFood += delta;
    timeSinceLastMove += delta;

    if (
        foods.length < MAX_FOOD_COUNT &&
        timeSinceLastFood > NEW_FOOD_INTERVAL
    ) {
        const newFood: Entity = {
            x: Math.round(Math.random() * (GAME_SIZE.width - 3)) + 2,
            y: Math.round(Math.random() * (GAME_SIZE.height - 3)) + 2,
        } as const;
        if (!isEntityOnPlayer(newFood)) {
            foods.push(newFood);
        }
        timeSinceLastFood = 0;
    }

    if (timeSinceLastMove > MOVE_INTERVAL) {
        for (let i = player.length - 1; i >= 0; i--) {
            const part = player[i];
            if (i === 0) {
                switch (playerDirection) {
                    case PLAYER_DIRECTIONS.left:
                        part.x--;
                        break;
                    case PLAYER_DIRECTIONS.right:
                        part.x++;
                        break;
                    case PLAYER_DIRECTIONS.up:
                        part.y--;
                        break;
                    case PLAYER_DIRECTIONS.down:
                        part.y++;
                        break;
                }
            } else {
                part.x = player[i - 1].x;
                part.y = player[i - 1].y;
            }
        }

        for (let i = 0; i < foods.length; i++) {
            const food = foods[i];
            if (food && player[0].x === food.x && player[0].y === food.y) {
                foods.splice(i, 1);

                const newHead = {
                    x: player[0].x,
                    y: player[0].y,
                };
                switch (playerDirection) {
                    case PLAYER_DIRECTIONS.left:
                        newHead.x--;
                        break;
                    case PLAYER_DIRECTIONS.right:
                        newHead.x++;
                        break;
                    case PLAYER_DIRECTIONS.up:
                        newHead.y--;
                        break;
                    case PLAYER_DIRECTIONS.down:
                        newHead.y++;
                        break;
                }
                player.unshift(newHead);
                score += 100;

                break;
            }
        }

        if (
            player[0].x === 1 ||
            player[0].x === GAME_SIZE.width ||
            player[0].y === 1 ||
            player[0].y === GAME_SIZE.height ||
            isEntityOnPlayerTailPartPosition(player[0])
        ) {
            gameState = GAME_STATES.over;
        }
        timeSinceLastMove = 0;
    }
}

function draw(): void {
    process.stdout.write(
        process.platform === "win32"
            ? "\x1B[2J\x1B[0f"
            : "\x1B[2J\x1B[3J\x1B[H",
    );
    switch (gameState) {
        case GAME_STATES.waiting:
            waitingScreen();
            break;
        case GAME_STATES.playing:
            gameScreen();
            break;
        case GAME_STATES.over:
            gameOverScreen();
            break;
        default:
            process.exit(1);
    }
}

function waitingScreen(): void {
    for (let c = 1; c <= GAME_SIZE.height; c++) {
        if (c === Math.round(GAME_SIZE.height / 2)) {
            console.log("Press space bar on your keyboard to play!");
            console.log("  Press escape on your keyboard to exit");
            c++;
            continue;
        }
        console.log();
    }
}

function gameScreen(): void {
    for (let c = 1; c <= GAME_SIZE.height; c++) {
        let line = "";
        for (let c2 = 1; c2 <= GAME_SIZE.width; c2++) {
            if (
                c === 1 ||
                c === GAME_SIZE.height ||
                c2 === 1 ||
                c2 === GAME_SIZE.width
            ) {
                line += BLOCKS.wall;
            } else if (isEntityOnFoodPosition({x: c2, y: c})) {
                line += BLOCKS.food;
            } else if (isEntityOnPlayerHeadPosition({x: c2, y: c})) {
                line += BLOCKS.playerHead;
            } else if (isEntityOnPlayerTailPartPosition({x: c2, y: c})) {
                line += BLOCKS.playerTail;
            } else {
                line += BLOCKS.empty;
            }
        }

        if (c === GAME_SIZE.height) {
            line += `Your Score: ${score}`;
        }

        console.log(line);
    }
}

function isEntityOnFoodPosition(entity: Entity): boolean {
    for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (food && food.x === entity.x && food.y === entity.y) {
            return true;
        }
    }
    return false;
}

function isEntityOnPlayerHeadPosition(entity: Entity): boolean {
    return player[0].x === entity.x && player[0].y === entity.y;
}

function isEntityOnPlayerTailPartPosition(entity: Entity): boolean {
    for (let i = 1; i < player.length; i++) {
        const part = player[i];
        if (part.x === entity.x && part.y === entity.y) {
            return true;
        }
    }
    return false;
}

function isEntityOnPlayer(entity: Entity) {
    return (
        isEntityOnPlayerHeadPosition(entity) ||
        isEntityOnPlayerTailPartPosition(entity)
    );
}

function gameOverScreen(): void {
    for (let c = 1; c <= GAME_SIZE.height; c++) {
        if (c === Math.round(GAME_SIZE.height / 2)) {
            console.log("                Game Over");
            console.log(`              Your Score is ${score}`);
            console.log("Press space bar on your keyboard to play again!");
            console.log("     Press escape on your keyboard to exit");
            c += 3;
            continue;
        }
        console.log();
    }
}
