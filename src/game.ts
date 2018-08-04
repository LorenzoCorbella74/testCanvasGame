import { Enemy } from './enemies';
import { PowerUp } from './powerup';
import { ControlHandler } from './controller';
import { Player } from './player';
import { conf as c } from './config';
import { Camera } from './camera';
import { Map } from './maps';
import {Helper} from'./helper';

import {BulletHandler} from './bullet';
import { Particelle } from './particelle';
import { Blood } from './blood';

window.onload = function () {
    let app = new Game();
    app.loadMenuScreen(app);
};

export default class Game {

    // CANVAS
    canvas:            HTMLCanvasElement;
    ctx:               CanvasRenderingContext2D;
    width:             number = c.CANVAS_WIDTH; // window.innerWidth;
    height:            number = c.CANVAS_HEIGHT; // window.innerHeight;

    // GAME ENTITIES
    player:            Player;
    enemy:             Enemy;
    bullet:            BulletHandler;
    camera:            Camera;
    control:           ControlHandler;
    powerup:           PowerUp;
    particelle:        Particelle;
    blood:             Blood;
    currentMap:        Map;
    state:             string;

    // GAME PARAMETERS
    killsToWin:    number = c.GAME_KILLS_TO_WIN;
    matchDuration: number = c.GAME_MATCH_DURATION;
    numberOfBots:  number = c.GAME_BOTS_PER_MATCH;
    gameType:      string = 'Deathmatch';           // TODO: sarà in seguito anche Team Deathmatch, Capture the flag, Skirmish
    data:          any;

    // UI
    fontFamily:        string = c.FONT_FAMILY;;

    constructor() {
        this.canvas        = <HTMLCanvasElement>document.getElementById('canvas');
        this.canvas.width  = this.width;
        this.canvas.height = this.height;
        this.ctx           = this.canvas.getContext("2d");
        
        this.player        = new Player(this);  // PLAYER
        this.enemy         = new Enemy(this);    // ENEMY
        this.bullet        = new BulletHandler(this);
        this.player.setShotHandler(this.bullet);
        this.enemy.setShotHandler(this.bullet);

        this.camera        = new Camera(0, 0, c.CANVAS_WIDTH, c.CANVAS_HEIGHT, this);
        this.control       = new ControlHandler(this);
        this.currentMap    = new Map(this);
        this.particelle    = new Particelle(this);
        this.powerup       = new PowerUp(this);
        this.blood         = new Blood(this);
        this.state         = 'loading';
        // si lega gli handler dei controlli al player
        this.player.setControlHandler(this.control);
        this.player.isFollowedBY(this.camera, this.currentMap);
        this.enemy.isFollowedBY(this.camera, this.currentMap);
        
        this.bullet.useIstance(this.currentMap, this.blood);
        
        // Camera is set to the player and on the default map
        this.camera.setCurrentMap(this.currentMap);
        this.camera.setCurrentPlayer(this.player);
    }

    // fa partire il gameloop
    startGame() {
        this.state = 'game';
        this.canvas.style.cursor='crosshair';
        
        let botsArray = Array(this.numberOfBots).fill(null).map((e,i)=> i);
        this.data = this.currentMap.loadSpawnPointsAndPowerUps();

         botsArray.forEach((elem:any, index:number) => {
             let e = this.data.spawn[index];
             this.enemy.create(e.x,e.y, index); // si crea un nemico
         });

         // POWERUP
         this.data.powerup.forEach((e:any) => {
            this.powerup.create(e.x, e.y, e.type); // si crea il powerup
        });

        this.gameLoop();
    }

    private gameLoop(): void {
        if (this.state != 'game') {
            return
        }

        for (let i = 0; i < this.enemy.list.length; i++) {
            const bot = this.enemy.list[i];
            if (this.player.kills == this.killsToWin || bot.kills == this.killsToWin) {
                this.state = 'gameOverScreen';
                this.loadStatsScreen(this);
                return; 
            }
        }

        // need to bind the current this reference to the callback
        requestAnimationFrame(this.gameLoop.bind(this));

        this.updateAll();
        this.renderAll();
    }

    updateAll() {
        this.player.update();
        this.camera.update();
        this.enemy.update();
        this.bullet.update(); 
        this.powerup.update();
        this.particelle.update();
        this.blood.update();
        // particles:esplosioni
    }

    renderAll(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);  // svuota il canvas
        this.currentMap.render();
        this.player.render();
        this.enemy.render();
        this.bullet.render(); 
        this.powerup.render();
        this.particelle.render();
        this.blood.render();
        // particles:esplosioni

        this.renderHUD();   // HUD
    }

    private renderHUD() {
        this.ctx.fillStyle = c.HUD_BACKGROUND;
        this.ctx.fillRect(0, 0, c.CANVAS_WIDTH, c.TILE_SIZE);
        this.ctx.textAlign = 'LEFT';
        this.ctx.font = 'bold 14px/1 Arial';
        this.ctx.fillStyle = '#565454';
        this.ctx.fillText('HP ', 5, c.TILE_SIZE / 2);
        this.ctx.fillText('AP ', 85, c.TILE_SIZE / 2);
        this.ctx.fillText('Kills ', 165, c.TILE_SIZE / 2);
        this.ctx.font = 'bold 14px/1 Arial';
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillText(Math.round(this.player.hp).toString(), 30, c.TILE_SIZE / 2);
        this.ctx.fillText(Math.round(this.player.ap).toString(), 110, c.TILE_SIZE / 2);
        this.ctx.fillText(Math.round(this.player.kills).toString(), 200, c.TILE_SIZE / 2);
    }

    textONCanvas(context, text, x, y, font, style, align?, baseline?) {
        context.font = typeof font === 'undefined' ? 'normal 16px/1 Arial' : font;
        context.fillStyle = typeof style === 'undefined' ? '#000000' : style;
        context.textAlign = typeof align === 'undefined' ? 'center' : align;
        context.textBaseline = typeof baseline === 'undefined' ? 'middle' : baseline;
        context.fillText(text, x, y)
    }

    loadMenuScreen(main: any) {
        main.canvas.style.cursor='pointer';
        main.state = 'menuScreen';
        main.control.mouseLeft = false;
        main.ctx.clearRect(0, 0, main.canvas.width, main.canvas.height);
        var hW = main.canvas.width * 0.5;
        var hH = main.canvas.height * 0.5;
        var dark = 'rgba(0,0,0)';
        var medium = 'rgba(0,0,0)';
        var light = 'rgba(0,0,0)';
        this.textONCanvas(main.ctx, 'TEST 2D Shooter', hW, hH - 100, 'normal 32px/1 ' + main.fontFamily, light, );
        this.textONCanvas(main.ctx, 'Use "WASD" to move and "Left Click" to shoot.', hW, hH - 30, 'normal 15px/1 ' + main.fontFamily, medium);
        this.textONCanvas(main.ctx, 'Use mouse wheel to change weapons.', hW, hH - 10, 'normal 15px/1 ' + main.fontFamily, medium);
        this.textONCanvas(main.ctx, 'Click to Start', hW, hH + 50, 'normal 17px/1 ' + main.fontFamily, dark);

        this.textONCanvas(main.ctx, 'L.Corbella © 2018', 9, main.canvas.height - 14, 'normal 13px/1 ' + main.fontFamily, light, 'left')
    }

    loadStatsScreen(main: any) {
        main.canvas.style.cursor='pointer';
        main.state = 'gameOverScreen';
        main.control.mouseLeft = false;
        main.ctx.clearRect(0, 0, main.canvas.width, main.canvas.height);
        var hW = main.canvas.width * 0.3;
        var hH = main.canvas.height * 0.5;
        var dark = 'rgba(0,0,0)';
        var medium = 'rgba(0,0,0)';
        var light = 'rgba(0,0,0)';
        this.textONCanvas(main.ctx, '2D Shooter', 9, 18, 'normal 21px/1 ' + main.fontFamily, light, 'left');
        this.textONCanvas(main.ctx, 'Partita completata!', hW, hH - 70, 'normal 22px/1 ' + main.fontFamily, dark);
        this.textONCanvas(main.ctx, `${main.player.name} - ${main.player.kills} - ${main.player.numberOfDeaths}`, hW, hH - 30, 'normal 16px/1 ' + main.fontFamily, medium);
        for (let i = 0; i < this.enemy.list.length; i++) {
            const bot = this.enemy.list[i];
            this.textONCanvas(main.ctx, `${bot.name} - ${bot.kills} - ${bot.numberOfDeaths}`, hW, hH - 30 +(20*(i+1)), 'normal 16px/1 ' + main.fontFamily, medium);
        }
        this.textONCanvas(main.ctx, 'Click to Restart', hW, main.canvas.height - 44, 'normal 17px/1 ' + main.fontFamily, dark);
        this.textONCanvas(main.ctx, 'L.Corbella © 2018', 9, main.canvas.height - 14, 'normal 13px/1 ' + main.fontFamily, light, 'left')
    }
}