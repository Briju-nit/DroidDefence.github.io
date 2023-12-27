const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const leaderboard_div = document.querySelector(".leaderboard-div");
const view_button = document.getElementById("show-lboard");
const startbtn = document.getElementById("start");

//take relative to the window size
const size = Math.min(window.innerWidth, window.innerHeight) * 0.95;
canvas.width = size;
canvas.height = size;
const player = {
    x: size * 0.1,
    y: size * 0.9,
    xdir: 0,
    ydir: 0,
    life: 10
};
const spawn = {
    x: -size * 0.1,
    y: -size * 0.1,
    time: 0,
    eaten: false
};
let base_life = 10;
let bots = [];
let bullets = [];
let enemybullets = [];
let score = 0;
let started = false;
let mousex = 0;
let mousey = 0;
let time = 0;
let enemy_life = 300;
let leaderboard = localStorage.getItem('leaderboard') || "";
if (leaderboard[0] === ",") leaderboard = leaderboard.slice(1);
if (leaderboard[leaderboard.length - 1] === ",") leaderboard = leaderboard.slice(0, -1);
let scores = leaderboard.split(',');
let intscores = scores.map(intscores => parseInt(intscores));
intscores.sort((a, b) => b - a);

function rank(ele) {
    ind = intscores.indexOf(ele);
    if (ind !== -1) {
        if (intscores[ind - 1] === ele) {
            return rank(intscores[ind - 1]);//for repeated scores gives same rank
        }
        return ind + 1;//rank starts from 1 so rank=ind+1;
    }
}

let htm = `<table class="leaderboard" border><tr><th>Rank</th><th>Score</th></tr>`;
for (let i = 0; rank(intscores[i]) <= 10; i++) {
    htm += `<tr><td>${rank(intscores[i])}</td><td>${intscores[i]}</td></tr>`;
}
htm += `</table>`;
leaderboard_div.innerHTML = htm;

function move_player(event) {
    if (started) {
        if (event.key === "ArrowLeft") {
            player.xdir = -1;
            player.ydir = 0;
        }
        else if (event.key === "ArrowRight") {
            player.xdir = 1;
            player.ydir = 0;
        }
        else if (event.key === "ArrowUp") {
            player.xdir = 0;
            player.ydir = -1
        }
        else if (event.key === "ArrowDown") {
            player.xdir = 0;
            player.ydir = 1;
        }
        player.x += player.xdir * size * 0.01;
        player.y += player.ydir * size * 0.01;
    }
}
function shoot(event) {
    if (started) {
        //clientX and clientY are positions of mouse absolutely
        //to find it relative to the canvas subtract canvas positions from it
        if (event.clientX - rect.left > 0 && event.clientX - rect.left < size &&
            event.clientY - rect.top > 0 && event.clientY - rect.top < size) {
            let delx = event.clientX - rect.left - player.x;
            let dely = event.clientY - rect.top - player.y;
            let pyth = Math.sqrt(delx * delx + dely * dely);
            const bullet = {
                x: player.x,
                y: player.y,
                dx: delx / pyth * 8,
                dy: dely / pyth * 8,
                kills: 0
            };
            bullets.push(bullet);
        }
    }
}
function enemy_shoot() {
    if (started && enemy_life > 0) {
        let delx = player.x - size * 0.5;
        let dely = player.y - size * 0.1;
        let pyth = Math.sqrt(delx * delx + dely * dely);
        const enemybot = {
            x: size * 0.5,
            y: size * 0.1,
            dx: delx / pyth * 8,
            dy: dely / pyth * 8,
        };
        enemybullets.push(enemybot);
    }
}
function drawline(event) {
    if (started) {
        mousex = event.clientX - rect.left;
        mousey = event.clientY - rect.top;
        if (mousex > 0 && mousex < size && mousey > 0 && mousey < size) {
            ctx.strokeStyle = "brown";
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(mousex, mousey);
            ctx.stroke();
            ctx.closePath();
        }
    }
}
function sound() {
    const audio_context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio_context.createOscillator();
    oscillator.connect(audio_context.destination);
    oscillator.type = "sine";
    oscillator.start();
    oscillator.stop(audio_context.currentTime + 0.1);//stops in 0.1 second
}
function draw_everything() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "black"); // Start color at the center
    gradient.addColorStop(1, "black"); // End color at the outer circle

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const player_rem = new Path2D();
    player_rem.rect(size * 0.01, size * 0.01, size * 0.4, size * 0.03);
    ctx.fillStyle = "white";
    ctx.fill(player_rem);
    player_rem.closePath();


    const player_bar = new Path2D();
    player_bar.rect(size * 0.02 + player.life * size * 0.4 / 10, size * 0.008, size * 0.4 - player.life * size * 0.4 / 10, size * 0.032);
    ctx.fillStyle = "black";
    ctx.fill(player_bar);
    player_bar.closePath();

    ctx.fillStyle = "white";
    ctx.font = `${size * 0.027}px Aldrich`;
    ctx.fillText(`SCORE:${score}`, size * 0.437, size * 0.03);

    ctx.fillStyle = "black";
    ctx.font = `${size * 0.023}px Aldrich`;
    ctx.fillText("PLAYER LIFE", size * 0.13, size * 0.032);

    const base_rem = new Path2D();
    base_rem.rect(size * 0.59, size * 0.01, size * 0.4, size * 0.03);
    ctx.fillStyle = "rgb(0, 128, 128)";
    ctx.fill(base_rem);

    base_rem.closePath();

    const base_bar = new Path2D();
    base_bar.rect(size * 0.59 + base_life * size * 0.4 / 10, size * 0.008, size * 0.4 - base_life * size * 0.4 / 10, size * 0.032);
    ctx.fillStyle = "black";
    ctx.fill(base_bar);
    base_bar.closePath();

    ctx.fillStyle = "white";
    ctx.font = `${size * 0.023}px Aldrich`;
    ctx.fillText("BASE LIFE", size * 0.72, size * 0.03);

    ctx.rect(size * 0.32, size * 0.5, size * 0.35, size * 0.3);
    ctx.fillStyle = "rgb(0,128,128)";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `bold ${size * 0.032}px Aldrich`;
    ctx.fillText("BASE 🌏", size * 0.5 - size * 0.1 + size * 0.03, size * 0.65 + size * 0.006);

    ctx.fillStyle = "rgb(144,238,144";
    for (let i = 0; i < bots.length; i++) {
        ctx.fillRect(bots[i][0], bots[i][1], size * 0.03, size * 0.03);
        bots[i][1] += size * 0.003;
    }
    if (enemy_life > 0) {
        let enemy_bot = new Path2D();
        enemy_bot.arc(size * 0.5, size * 0.13, size * 0.06, 0, Math.PI * 2, true);
        ctx.fill(enemy_bot);
        ctx.fillStyle = "white";
        ctx.font = `bold ${size * 0.022}px Aldrich`;
        enemy_bot.closePath();
    }
    if (started) {
        ctx.fillStyle = "red";
        if (time % 2000 == 0) {
            spawn.x = size * (Math.random() * 0.8 + 0.1);
            spawn.y = size * (Math.random() * 0.4 + 0.2);
            spawn.eaten = false;
            spawn.time = 0;
        }
        if (!spawn.eaten) ctx.fillRect(spawn.x, spawn.y, size * 0.03, size * 0.03);
        spawn.time++;
    }
    //after some time the spawn will disapper
    if (spawn.time === 800) {
        spawn.x = -size * 0.1;
        spawn.y = -size * 0.1;
    }

    if (
        player.y - size * 0.05 < spawn.y + size * 0.03 &&
        player.y + size * 0.05 > spawn.y &&
        player.x - size * 0.05 < spawn.x + size * 0.03 &&
        player.x + size * 0.05 > spawn.x
    ) {
        if (base_life < 10) base_life++;
        if (player.life <= 9) player.life++;
        else if (player.life <= 10) player.life = 10;
        spawn.eaten = true;
        spawn.x = -size * 0.1;
        spawn.y = -size * 0.1;
    }


    ctx.fillStyle = "transparent";
    for (let i = 0; i < bullets.length; i++) {
        ctx.fillRect(bullets[i].x, bullets[i].y, size * 0.003, size * 0.003);
        ctx.fillStyle = "white";
        ctx.fillText("🚀", bullets[i].x, bullets[i].y, size * 0.021, size * 0.021);
        bullets[i].x += bullets[i].dx;
        bullets[i].y += bullets[i].dy;
        if (!(bullets[i].y > 0 && bullets[i].y < size && bullets[i].x > 0 && bullets[i].x < size)) {
            if (bullets[i].kills === 0) {
                //fruitless bullets will decrease score
                if (score > 0) score--;
            }
            bullets.splice(i, 1);
        }
    }

    ctx.fillStyle = "transparent";
    for (let i = 0; i < enemybullets.length; i++) {
        ctx.fillRect(enemybullets[i].x, enemybullets[i].y, size * 0.003, size * 0.003);
        ctx.fillStyle = "white";
        ctx.fillText("🛸", enemybullets[i].x, enemybullets[i].y, size * 0.021, size * 0.021);
        enemybullets[i].x += enemybullets[i].dx;
        enemybullets[i].y += enemybullets[i].dy;
        if (!(enemybullets[i].y > 0 && enemybullets[i].y < size && enemybullets[i].x > 0 && enemybullets[i].x < size)) {
            enemybullets.splice(i, 1);
        }
    }

    if (player.x < size * 1.05 && player.x > -size * 0.05 &&
        player.y < size * 1.05 && player.y > -size * 0.05) {
        let player_body = new Path2D();
        player_body.arc(player.x, player.y, size * 0.06, 0, Math.PI * 2, true)
        ctx.fillStyle = "white";
        ctx.fill(player_body);
        ctx.fillStyle = "white";
        ctx.font = `bold ${size * 0.026}px Aldrich`;
        player_body.closePath();
    }

    else {
        if (player.x >= size * 1.05) {
            player.x = -size * 0.05;
        }
        else if (player.x <= -esiz * 0.05) {
            player.x = size * 1.05;
        }
        if (player.y >= size * 1.05) {
            player.y = -size * 0.05;
        }
        else if (player.y <= -size * 0.05) {
            player.y = size * 1.05;
        }
    }

    for (let i = 0; i < bots.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            //check if bullet hit the bot
            try {
                if (
                    bullets[j].x < bots[i][0] + size * 0.03 &&//bot height,width=size*0.03
                    bullets[j].x + size * 0.02 > bots[i][0] &&//bullet height,width=size*0.02
                    bullets[j].y < bots[i][1] + size * 0.03 &&
                    bullets[j].y + size * 0.02 > bots[i][1]
                ) {
                    bots.splice(i, 1);
                    bullets[j].kills++;
                    score += 4;
                    sound();
                }
            }
            catch (error) { }
        }
        try {

            //check if it hits the home base and decrease home health
            if (
                size * 0.50 < bots[i][1] + size * 0.03 &&
                size * 0.8 > bots[i][1] &&
                size * 0.3 < bots[i][0] + size * 0.03 &&
                size * 0.7 > bots[i][0]
            ) {
                base_life--;
                bots.splice(i, 1);
            }

            //check if it hits the player and decrease playerhealth
            if (
                player.y - size * 0.05 < bots[i][1] + size * 0.03 &&
                player.y + size * 0.05 > bots[i][1] &&
                player.x - size * 0.05 < bots[i][0] + size * 0.03 &&
                player.x + size * 0.05 > bots[i][0]
            ) {
                player.life--;
                bots.splice(i, 1);
            }


            //if bots survive till bottom decrease score
            if (bots[i][1] > size) {
                bots.splice(i, 1);
                if (score > 0) score--;
            }
        }
        catch (error) { }
    }

    for (let i = 0; i < enemybullets.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            try {
                if (
                    enemybullets[i].x < bullets[j].x + size * 0.02 &&
                    enemybullets[i].x + size * 0.03 > bullets[j].x &&
                    enemybullets[i].y < bullets[j].y + size * 0.02 &&
                    enemybullets[i].y + size * 0.03 > bullets[j].y
                ) {
                    enemybullets.splice(i, 1);
                    bullets[i].kills++;
                }
            }
            catch (error) { }

        }
        if (
            player.y - size * 0.05 < enemybullets[i].y + size * 0.03 &&
            player.y + size * 0.05 > enemybullets[i].y &&
            player.x - size * 0.05 < enemybullets[i].x + size * 0.03 &&
            player.x + size * 0.05 > enemybullets[i].x
        ) {
            enemybullets.splice(i, 1);
            player.life -= 0.25;
        }
        if (
            size * 0.7 < enemybullets[i].y + size * 0.03 &&
            size * 0.8 > enemybullets[i].y &&
            size * 0.3 < enemybullets[i].x + size * 0.03 &&
            size * 0.7 > enemybullets[i].x
        ) {
            enemybullets.splice(i, 1);
            base.life -= 0.25;
        }
    }

    for (let i = 0; i < bullets.length; i++) {
        if (
            size * 0.1 - size * 0.05 < bullets[i].y + size * 0.03 &&
            size * 0.1 + size * 0.05 > bullets[i].y &&
            size * 0.5 - size * 0.05 < bullets[i].x + size * 0.03 &&
            size * 0.5 + size * 0.05 > bullets[i].x
        ) {
            enemy_life--;
            bullets.splice(i, 1);
        }

    }

    if (player.life <= 0 || base_life <= 0) {
        return reloadPage();
    }
    if (started) time++;
}

game_interval = setInterval(draw_everything, 15);

function reloadPage() {
    clearInterval(game_interval);
    scores.push(score.toString());
    leaderboard = scores.join(',');
    localStorage.setItem('leaderboard', leaderboard);
    alert("GAME OVER 🚨🚨 OH NO  Your score:" + score);
    location.reload(true);
}

document.addEventListener("keydown", move_player);
document.addEventListener("mousedown", shoot);
setInterval(enemy_shoot, 4000);
const rect = canvas.getBoundingClientRect();
//rect gets the position of canvas top left point

document.addEventListener("mousemove", drawline);

startbtn.onclick = function () {
    if (!started) {
        started = true;
        setInterval(function () {
            bots.push([Math.random() * 0.92 * size, size * 0.05]);
        }, 2000);
    }
}
view_button.onclick = function () {
    if (!started) {
        if (leaderboard_div.style.display === "none") {
            leaderboard_div.style.display = "block";
            canvas.style.display = "none";
        }
        else {
            leaderboard_div.style.display = "none";
            canvas.style.display = "flex";
        }
    }
}