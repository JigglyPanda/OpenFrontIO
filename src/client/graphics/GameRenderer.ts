import {Colord} from "colord";
import {Cell, Game, PlayerEvent, Tile, TileEvent, Player, Execution, BoatEvent} from "../../core/Game";
import {Theme} from "../../core/configuration/Config";
import {DragEvent, ZoomEvent} from "../InputHandler";
import {NameRenderer} from "./NameRenderer";
import {TerrainRenderer} from "./TerrainRenderer";
import {TerritoryRenderer} from "./TerritoryRenderer";

export class GameRenderer {
	private territoryCanvas: HTMLCanvasElement
	private canvas: HTMLCanvasElement

	private territoryContext: CanvasRenderingContext2D

	private scale: number = 1.8
	private offsetX: number = -350
	private offsetY: number = -200

	private context: CanvasRenderingContext2D

	private nameRenderer: NameRenderer;
	private territoryRenderer: TerritoryRenderer;

	private theme: Theme

	private exitButton: HTMLButtonElement;


	constructor(private gs: Game, private terrainRenderer: TerrainRenderer) {
		this.theme = gs.config().theme()
		this.nameRenderer = new NameRenderer(gs, this.theme)
		this.territoryRenderer = new TerritoryRenderer(gs)
	}

	initialize() {
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');

		// Set canvas style to fill the screen
		this.canvas.style.position = 'fixed';
		this.canvas.style.left = '0';
		this.canvas.style.top = '0';
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';

		this.nameRenderer.initialize()
		this.terrainRenderer.init()
		this.territoryRenderer.init()


		document.body.appendChild(this.canvas);
		window.addEventListener('resize', () => this.resizeCanvas());
		this.resizeCanvas();


		this.territoryCanvas = document.createElement('canvas')
		this.territoryCanvas.width = this.gs.width();
		this.territoryCanvas.height = this.gs.height();
		this.territoryContext = this.territoryCanvas.getContext('2d')
		this.territoryContext.globalAlpha = 0.4;

		this.createExitButton()


		requestAnimationFrame(() => this.renderGame());
	}



	createExitButton() {
		this.exitButton = document.createElement('button');
		this.exitButton.innerHTML = '&#10005;'; // HTML entity for "×" (multiplication sign)
		this.exitButton.style.position = 'fixed';
		this.exitButton.style.top = '20px';
		this.exitButton.style.right = '20px';
		this.exitButton.style.zIndex = '1000';
		this.exitButton.style.width = '40px';
		this.exitButton.style.height = '40px';
		this.exitButton.style.fontSize = '20px';
		this.exitButton.style.fontWeight = 'bold';
		this.exitButton.style.backgroundColor = 'rgba(255, 0, 0, 0.4)'; // More translucent red
		this.exitButton.style.color = 'white';
		this.exitButton.style.border = 'none';
		this.exitButton.style.borderRadius = '50%';
		this.exitButton.style.cursor = 'pointer';
		this.exitButton.style.display = 'flex';
		this.exitButton.style.justifyContent = 'center';
		this.exitButton.style.alignItems = 'center';
		this.exitButton.style.transition = 'background-color 0.3s';

		this.exitButton.addEventListener('mouseover', () => {
			this.exitButton.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Less translucent on hover
		});

		this.exitButton.addEventListener('mouseout', () => {
			this.exitButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Back to more translucent
		});

		this.exitButton.addEventListener('click', () => this.onExitButtonClick());
		document.body.appendChild(this.exitButton);
	}

	onExitButtonClick() {
		console.log('Button clicked!');
		window.location.reload();
		// Add your button action here
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		//this.redraw()
	}

	renderGame() {
		// Set background
		this.context.fillStyle = this.theme.backgroundColor().toHex();
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Save the current context state
		this.context.save();


		// Disable image smoothing for pixelated effect
		if (this.scale > 3) {
			this.context.imageSmoothingEnabled = false;
		} else {
			this.context.imageSmoothingEnabled = true;
		}

		// Apply zoom and pan
		this.context.setTransform(
			this.scale,
			0,
			0,
			this.scale,
			this.gs.width() / 2 - this.offsetX * this.scale,
			this.gs.height() / 2 - this.offsetY * this.scale
		);

		this.terrainRenderer.draw(this.context)
		this.territoryRenderer.draw(this.context)

		const [upperLeft, bottomRight] = this.boundingRect()
		this.nameRenderer.render(this.context, this.scale, upperLeft, bottomRight)

		this.context.restore()

		this.renderUIBar()

		requestAnimationFrame(() => this.renderGame());
	}


	renderUIBar() {
		if (!this.gs.inSpawnPhase()) {
			return
		}

		const barHeight = 15;
		const barBackgroundWidth = this.canvas.width;

		const ratio = this.gs.ticks() / this.gs.config().numSpawnPhaseTurns()

		// Draw bar background
		this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
		this.context.fillRect(0, 0, barBackgroundWidth, barHeight);

		this.context.fillStyle = 'rgba(0, 128, 255, 0.7)';
		this.context.fillRect(0, 0, barBackgroundWidth * ratio, barHeight);
	}

	tick() {
		this.nameRenderer.tick()
	}

	tileUpdate(event: TileEvent) {
		this.territoryRenderer.tileUpdate(event)
		// this.tileToRenderQueue.push({tileEvent: event, lastUpdate: this.gs.ticks() + this.random.nextFloat(0, .5)})
	}

	playerEvent(event: PlayerEvent) {
	}

	boatEvent(event: BoatEvent) {
		this.territoryRenderer.boatEvent(event)
	}

	resize(width: number, height: number): void {
		this.canvas.width = Math.ceil(width / window.devicePixelRatio);
		this.canvas.height = Math.ceil(height / window.devicePixelRatio);
	}

	// paintTerritory(tile: Tile) {
	// 	this.clearCell(tile.cell())
	// 	// if (!tile.hasOwner()) {
	// 	// 	this.clearCell(tile.cell())
	// 	// 	return
	// 	// }
	// 	// this.territoryContext.clearRect(tile.cell().x, tile.cell().y, 1, 1);
	// 	if (tile.isBorder()) {
	// 		this.territoryContext.fillStyle = this.theme.borderColor(tile.owner().id()).toRgbString()
	// 	} else {
	// 		this.territoryContext.fillStyle = this.theme.territoryColor(tile.owner().id()).alpha(100).toHex()
	// 	}
	// 	this.territoryContext.fillRect(tile.cell().x, tile.cell().y, 1, 1);
	// }

	paintCell(cell: Cell, color: Colord) {
		color = color.alpha(10)  // Assign the result back to color
		this.territoryContext.fillStyle = color.toHslString()
		this.territoryContext.fillRect(cell.x, cell.y, 1, 1);
	}

	clearCell(cell: Cell) {
		this.territoryContext.clearRect(cell.x, cell.y, 1, 1);
	}

	onZoom(event: ZoomEvent) {
		const oldScale = this.scale;
		const zoomFactor = 1 + event.delta / 600;
		this.scale /= zoomFactor;

		// Clamp the scale to prevent extreme zooming
		this.scale = Math.max(0.5, Math.min(20, this.scale));

		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasX = event.x - canvasRect.left;
		const canvasY = event.y - canvasRect.top;

		// Calculate the world point we want to zoom towards
		const zoomPointX = (canvasX - this.gs.width() / 2) / oldScale + this.offsetX;
		const zoomPointY = (canvasY - this.gs.height() / 2) / oldScale + this.offsetY;

		// Adjust the offset
		this.offsetX = zoomPointX - (canvasX - this.gs.width() / 2) / this.scale;
		this.offsetY = zoomPointY - (canvasY - this.gs.height() / 2) / this.scale;
	}

	onMove(event: DragEvent) {
		this.offsetX -= event.deltaX / this.scale;
		this.offsetY -= event.deltaY / this.scale;
	}


	screenToWorldCoordinates(screenX: number, screenY: number): Cell {

		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasX = screenX - canvasRect.left;
		const canvasY = screenY - canvasRect.top;

		// Calculate the world point we want to zoom towards
		const centerX = (canvasX - this.gs.width() / 2) / this.scale + this.offsetX;
		const centerY = (canvasY - this.gs.height() / 2) / this.scale + this.offsetY;

		const gameX = centerX + this.gs.width() / 2
		const gameY = centerY + this.gs.height() / 2

		return new Cell(Math.floor(gameX), Math.floor(gameY));
	}

	boundingRect(): [Cell, Cell] {

		// Calculate the world point we want to zoom towards
		const LeftX = (- this.gs.width() / 2) / this.scale + this.offsetX;
		const TopY = (- this.gs.height() / 2) / this.scale + this.offsetY;

		const gameLeftX = LeftX + this.gs.width() / 2
		const gameTopY = TopY + this.gs.height() / 2


		// Calculate the world point we want to zoom towards
		const rightX = (screen.width - this.gs.width() / 2) / this.scale + this.offsetX;
		const rightY = (screen.height - this.gs.height() / 2) / this.scale + this.offsetY;

		const gameRightX = rightX + this.gs.width() / 2
		const gameBottomY = rightY + this.gs.height() / 2

		return [new Cell(Math.floor(gameLeftX), Math.floor(gameTopY)), new Cell(Math.floor(gameRightX), Math.floor(gameBottomY))]
	}

}