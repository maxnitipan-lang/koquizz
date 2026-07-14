// ===========================================
// map.js - Arena scene (init3DArena), boss model (build3DBoss),
// and stage/substage navigation + battle entry.
// ===========================================
// NOTE: init3DArena() builds the environment ONLY (lighting, platform,
// background). build3DPlayer()/build3DBoss() are called separately by
// startBattle() with the correct character/difficulty.
//
// map1 = "Ice God Arena & Colossal Ice Qilin", ported as closely as
// possible from the standalone reference scene ("หกหก (1).html"): every
// position/size/radius/speed below is the reference's value divided by
// 10, so it lines up 1:1 with this file's shared compact battle-arena
// camera/platform/player/boss layout (camera z, arena platform radius,
// qilin pacing range, etc. all landed on/near the same numbers that were
// already tuned into game.js's animate3D() ice-map section).
// map2 / map3 = still empty placeholders, waiting for their own scenes
// (see the generic "else" branch inside init3DArena below).
// ===========================================

function init3DArena(mapKey) {
    mapKey = mapKey || (gameState.user && gameState.user.selectedMap) || 'map1';
    gameState.currentArenaMap = mapKey;
    const isIce = (mapKey === 'map1'); // Ice-God Arena
    const isGold = (mapKey === 'map2'); // Golden Dragon Thunder Arena, ported from "thunder_god_background_gold_version.html"

    threeDContainer = document.getElementById("threeDContainer");
    if (!threeDContainer) return;
    threeDContainer.innerHTML = "";

    const w = threeDContainer.clientWidth;
    const h = threeDContainer.clientHeight;

    scene = new THREE.Scene();
    if (isIce) {
        scene.background = new THREE.Color(0x5a9bd4);
        scene.fog = new THREE.FogExp2(0x8bc3ea, 0.035); // reference density 0.0035 * 10 (world is 1/10 scale)
    } else if (isGold) {
        scene.background = new THREE.Color(0x050300);
        scene.fog = new THREE.FogExp2(0x150f02, 0.03);
    } else {
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
    }

    // Reference uses a wide establishing fov (60); pulled narrower + camera dollied
    // closer here (see arenaCameraZ below) so the two fighters read clearly in the
    // small in-game viewport instead of being dwarfed by the mountains/qilin.
    camera = new THREE.PerspectiveCamera(isIce ? 45 : (isGold ? 42 : 40), w / h, 0.1, 150);
    camera.position.set(0, 2.5, 9.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = (isIce || isGold) ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    renderer.toneMappingExposure = isIce ? 1.2 : (isGold ? 1.3 : 1.0);
    threeDContainer.appendChild(renderer.domElement);

    godRay = null; godRayInner = null; moon = null; moonGlow = null;

    if (isIce) {
        // Lighting values/positions taken straight from the reference (divided by 10 for position only).
        const ambient = new THREE.AmbientLight(0xddeeff, 2.6);
        scene.add(ambient);

        const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
        sunLight.position.set(2, 10, 3);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.bias = -0.001;
        scene.add(sunLight);

        // Combat hit-flash light (game.js recolors this every frame during battle reactions)
        pointLight = new THREE.PointLight(0xaadeff, 2.2, 25);
        pointLight.position.set(0, 3, 2);
        scene.add(pointLight);

        // Extra ambiance-only lights matching the reference's arenaLight / vortexLight
        const arenaGlow = new THREE.PointLight(0xaadeff, 6.0, 20);
        arenaGlow.position.set(0, 1, 0);
        scene.add(arenaGlow);

        const vortexGlow = new THREE.PointLight(0xffffff, 5.0, 30);
        vortexGlow.position.set(0, 10, -4);
        scene.add(vortexGlow);
    } else if (isGold) {
        // Lighting straight from the reference (divided by 10 for position only, intensities kept close)
        const ambient = new THREE.AmbientLight(0x443311, 1.6);
        scene.add(ambient);

        const heavenlyLight = new THREE.DirectionalLight(0xfff3cc, 2.5);
        heavenlyLight.position.set(0, 10, -1);
        heavenlyLight.castShadow = true;
        heavenlyLight.shadow.mapSize.width = 1024;
        heavenlyLight.shadow.mapSize.height = 1024;
        heavenlyLight.shadow.bias = -0.001;
        scene.add(heavenlyLight);

        // Combat hit-flash light (game.js recolors this every frame during battle reactions)
        pointLight = new THREE.PointLight(0xffcc55, 2.2, 25);
        pointLight.position.set(0, 3, 2);
        scene.add(pointLight);

        // Extra ambiance-only lights matching the reference's pool glow / sky flash
        const poolGlow = new THREE.PointLight(0xffbb00, 4.0, 20);
        poolGlow.position.set(0, -1, 0);
        scene.add(poolGlow);

        goldSkyFlashLight = new THREE.PointLight(0xfff3cc, 0, 30);
        goldSkyFlashLight.position.set(0, 4, -1);
        scene.add(goldSkyFlashLight);
    } else {
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambient);

        const skyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        skyLight.position.set(2, 20, 10);
        skyLight.castShadow = true;
        skyLight.shadow.mapSize.width = 1024;
        skyLight.shadow.mapSize.height = 1024;
        skyLight.shadow.bias = -0.001;
        scene.add(skyLight);

        pointLight = new THREE.PointLight(0x8b5cf6, 2.0, 25);
        pointLight.position.set(0, 3, 2);
        scene.add(pointLight);
    }

    if (isIce) {
        buildIceMountains();
    } else if (isGold) {
        buildGoldClouds();
        buildGoldPillars();
    } else {
        // TODO: พื้นหลังของแมพ 3 ใหม่ ใส่ตรงนี้
    }

    if (isIce) {
        buildIceArenaDais();
    } else if (isGold) {
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x1a1206,
            emissive: 0x332200,
            roughness: 0.2,
            metalness: 0.7
        });
        const platformBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.3, 0.4, 48), platformMat);
        platformBase.position.y = -1.8;
        platformBase.receiveShadow = true;
        scene.add(platformBase);
        buildGoldPool();
    } else {
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.3
        });
        const platformBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.3, 0.4, 48), platformMat);
        platformBase.position.y = -1.8;
        platformBase.receiveShadow = true;
        scene.add(platformBase);
    }

    backgroundSparks = null;
    if (isIce) {
        buildIceSnowfall();
    } else if (isGold) {
        buildGoldSparkParticles();
    }

    // Slash arc and shockwave (ใช้ร่วมกันทุกแมพ)
    const slashArcGeo = new THREE.RingGeometry(0.1, 1.4, 16, 1, 0, Math.PI * 1.5);
    const slashArcMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    slashArcMesh = new THREE.Mesh(slashArcGeo, slashArcMat);
    slashArcMesh.position.set(0, 0, 0);
    slashArcMesh.rotation.x = Math.PI / 2;
    scene.add(slashArcMesh);

    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.4, 16);
    const shockwaveMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    shockwaveRingMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveRingMesh.rotation.x = -Math.PI / 2;
    shockwaveRingMesh.position.y = -1.35;
    scene.add(shockwaveRingMesh);

    // Groups
    playerGroup = new THREE.Group();
    bossGroup = new THREE.Group();
    // Ice-God Arena: xianxia immortals float above the platform instead of
    // standing on it (see arenaFloatY / arenaCameraLiftY usage in game.js's
    // animate3D loop) — camera lifts to keep them framed too.
    arenaFloatY = isIce ? 1.8 : 0;
    // Match the camera's vertical lift to the character float exactly -- if
    // these two drift apart, the fighters end up sitting higher on screen
    // than the other maps and their heads get covered by the HP-bar HUD
    // panel docked at the top of the viewport.
    arenaCameraLiftY = isIce ? 1.8 : 0;
    arenaCameraZ = isIce ? 9.2 : 9.5;
    playerGroup.position.copy(targetPlayerPos);
    bossGroup.position.copy(targetBossPos);
    if (isIce) {
        // The fighters are modest-sized humanoids next to a colossal qilin and
        // mountains, so scale them up a bit + bring the camera in closer
        // (arenaCameraZ above) to make sure both clearly read against the
        // busy icy backdrop, without making them look oversized/blocky.
        playerGroup.scale.set(1.25, 1.25, 1.25);
        bossGroup.scale.set(1.25, 1.25, 1.25);
    } else {
        playerGroup.scale.set(1, 1, 1);
        bossGroup.scale.set(1, 1, 1);
    }
    scene.add(playerGroup);
    scene.add(bossGroup);

    if (isIce) {
        // The Ice-God Arena background is very bright/busy, so give each
        // fighter their own key spotlight + a grounding glow ring underneath
        // to make sure both of them clearly stand out from the scenery.
        const playerSpot = new THREE.SpotLight(0x9fe0ff, 5.5, 14, Math.PI / 5, 0.45, 1.2);
        playerSpot.position.set(targetPlayerPos.x, targetPlayerPos.y + arenaFloatY + 4, targetPlayerPos.z + 3.5);
        playerSpot.target.position.set(targetPlayerPos.x, targetPlayerPos.y + arenaFloatY, targetPlayerPos.z);
        scene.add(playerSpot);
        scene.add(playerSpot.target);

        const bossSpot = new THREE.SpotLight(0xffe9b3, 5.5, 14, Math.PI / 5, 0.45, 1.2);
        bossSpot.position.set(targetBossPos.x, targetBossPos.y + arenaFloatY + 4, targetBossPos.z + 3.5);
        bossSpot.target.position.set(targetBossPos.x, targetBossPos.y + arenaFloatY, targetBossPos.z);
        scene.add(bossSpot);
        scene.add(bossSpot.target);

        function addFighterGlow(x, color) {
            const glowGeo = new THREE.RingGeometry(0.9, 2.1, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(x, -1.85, 0);
            scene.add(glow);
        }
        addFighterGlow(targetPlayerPos.x, 0x38bdf8);
        addFighterGlow(targetBossPos.x, 0xfacc15);
    } else if (isGold) {
        // The Golden Dragon Arena is bright/busy too (dragon, lightning, clouds),
        // so give each fighter the same key-light + grounding glow treatment.
        const playerSpot = new THREE.SpotLight(0xffdd88, 5.5, 14, Math.PI / 5, 0.45, 1.2);
        playerSpot.position.set(targetPlayerPos.x, targetPlayerPos.y + 4, targetPlayerPos.z + 3.5);
        playerSpot.target.position.set(targetPlayerPos.x, targetPlayerPos.y, targetPlayerPos.z);
        scene.add(playerSpot);
        scene.add(playerSpot.target);

        const bossSpot = new THREE.SpotLight(0xffb347, 5.5, 14, Math.PI / 5, 0.45, 1.2);
        bossSpot.position.set(targetBossPos.x, targetBossPos.y + 4, targetBossPos.z + 3.5);
        bossSpot.target.position.set(targetBossPos.x, targetBossPos.y, targetBossPos.z);
        scene.add(bossSpot);
        scene.add(bossSpot.target);

        function addGoldFighterGlow(x, color) {
            const glowGeo = new THREE.RingGeometry(0.9, 2.1, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(x, -1.75, 0);
            scene.add(glow);
        }
        addGoldFighterGlow(targetPlayerPos.x, 0xffdd88);
        addGoldFighterGlow(targetBossPos.x, 0xffb347);
    }

    // Decorative background cast (player/boss are built separately by startBattle())
    if (isIce) {
        buildIceTornados();
        buildIceVortex();
        buildIceQilin();
    } else if (isGold) {
        buildGoldDragon();
    } else {
        // TODO: มอนสเตอร์/สัตว์ประกอบฉากของแมพ 3 ใหม่ ใส่ตรงนี้
    }

    // Track mouse
    threeDContainer.addEventListener("mousemove", (e) => {
        const rect = threeDContainer.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    is3DInitialized = true;

    // Start animation loop
    animate3D();
}

// ===========================================
// Ice-God Arena & Colossal Ice Qilin (map1 background cast)
// Every number below = reference value / 10 (see file header).
// ===========================================

function generateIceTexture(color1, color2, cracks) {
    color1 = color1 || '#88ccff';
    color2 = color2 || '#2266aa';
    cracks = cracks === undefined ? true : cracks;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 300);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 4000; i++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 3, Math.random() * 3);
    }

    if (cracks) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 25; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 512, Math.random() * 512);
            for (let j = 0; j < 5; j++) {
                ctx.lineTo(Math.random() * 512, Math.random() * 512);
            }
            ctx.stroke();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

let iceGeneralMat = null;
function getIceGeneralMat() {
    if (!iceGeneralMat) {
        const tex = generateIceTexture();
        iceGeneralMat = new THREE.MeshStandardMaterial({
            map: tex, color: 0xffffff, emissive: 0x114466,
            roughness: 0.1, metalness: 0.5, bumpMap: tex, bumpScale: 4.0,
            flatShading: true
        });
    }
    return iceGeneralMat;
}

// Two jagged ice mountains flanking the arena. (reference positions -130/130,-35,-40 → /10)
function buildIceMountains() {
    iceGeneralMat = null; // fresh texture per arena init
    function createMountain(xPos) {
        const geo = new THREE.PlaneGeometry(22, 25, 50, 50);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const dist = Math.sqrt(vx * vx + vy * vy);
            let z = Math.max(-1, 9 - dist * 0.8);
            z += (Math.sin(vx * 1.0) * Math.cos(vy * 1.0)) * 2;
            z += (Math.cos(vx * 2.0) * Math.sin(vy * 2.0)) * 1;
            pos.setZ(i, z);
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, getIceGeneralMat());
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(xPos, -3.5, -4);
        return mesh;
    }
    scene.add(createMountain(-13));
    scene.add(createMountain(13));
}

// Frost dais: rounded ice arena floor, glyph ring, and swirling aura
// particles hugging the edge. (reference arenaGroup at (0,-25,0) → /10)
function buildIceArenaDais() {
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, -2.5, 0);
    scene.add(daisGroup);

    const daisGeo = new THREE.CylinderGeometry(5, 5.5, 1, 64);
    const daisMesh = new THREE.Mesh(daisGeo, getIceGeneralMat());
    daisMesh.receiveShadow = true;
    daisGroup.add(daisMesh);

    const ringGeo = new THREE.RingGeometry(4.6, 4.9, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    iceMagicRing = new THREE.Mesh(ringGeo, ringMat);
    iceMagicRing.rotation.x = -Math.PI / 2;
    iceMagicRing.position.y = 0.52;
    daisGroup.add(iceMagicRing);

    iceArenaAuraCount = 1500;
    const auraGeo = new THREE.BufferGeometry();
    const auraPos = new Float32Array(iceArenaAuraCount * 3);
    iceArenaAuraAngles = new Float32Array(iceArenaAuraCount);
    for (let i = 0; i < iceArenaAuraCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 1.5;
        auraPos[i * 3] = Math.cos(angle) * radius;
        auraPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5 + 0.5;
        auraPos[i * 3 + 2] = Math.sin(angle) * radius;
        iceArenaAuraAngles[i] = angle;
    }
    auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
    iceArenaAura = new THREE.Points(auraGeo, new THREE.PointsMaterial({
        size: 0.18, color: 0xaaddff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
    }));
    daisGroup.add(iceArenaAura);
}

// Five wireframe snowstorm pillars flanking the arena's back arc.
// (reference: radius 100, positions y=15, cylinder 15+j*4 / 5+j*3 / height 140 → all /10)
function buildIceTornados() {
    iceTornados = [];
    const numTornados = 5;
    for (let i = 0; i < numTornados; i++) {
        const angle = (i / (numTornados - 1)) * Math.PI - Math.PI;
        const radius = 10;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * (radius * 0.3) - 6;

        const tornadoGroup = new THREE.Group();
        tornadoGroup.position.set(px, 1.5, pz);

        for (let j = 1; j <= 3; j++) {
            const cylGeo = new THREE.CylinderGeometry(1.5 + j * 0.4, 0.5 + j * 0.3, 14, 16, 16, true);
            const cylMat = new THREE.MeshBasicMaterial({
                color: j === 1 ? 0xffffff : 0x00d4ff,
                wireframe: true,
                transparent: true,
                opacity: 0.6 / j,
                blending: THREE.AdditiveBlending
            });
            const cylMesh = new THREE.Mesh(cylGeo, cylMat);
            cylMesh.rotation.z = (Math.random() - 0.5) * 0.1;
            tornadoGroup.add(cylMesh);
            iceTornados.push({ mesh: cylMesh, speed: (Math.random() * 0.05 + 0.02) * (j % 2 === 0 ? -1 : 1) });
        }
        scene.add(tornadoGroup);
    }
}

// Overhead swirling snow vortex. (reference vortexGroup at (0,110,-20) → /10)
function buildIceVortex() {
    const vortexGroup = new THREE.Group();
    vortexGroup.position.set(0, 11, -2);
    scene.add(vortexGroup);

    iceVortexCount = 4000;
    iceVortexParticles = [];
    const vortexGeo = new THREE.BufferGeometry();
    const vortexPos = new Float32Array(iceVortexCount * 3);

    for (let i = 0; i < iceVortexCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * 9;
        const speed = 0.5 + Math.random() * 2.0;
        vortexPos[i * 3] = Math.cos(angle) * dist;
        vortexPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
        vortexPos[i * 3 + 2] = Math.sin(angle) * dist;
        iceVortexParticles.push({ angle: angle, dist: dist, speed: speed, yOffset: vortexPos[i * 3 + 1] });
    }
    vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
    iceVortexPoints = new THREE.Points(vortexGeo, new THREE.PointsMaterial({
        size: 0.2, color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending
    }));
    vortexGroup.add(iceVortexPoints);
}

// Falling snow across the whole ice arena. (reference spread 400/200/200 → /10)
function buildIceSnowfall() {
    iceSnowCount = 6000;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(iceSnowCount * 3);
    iceSnowSpeeds = new Float32Array(iceSnowCount);
    for (let i = 0; i < iceSnowCount; i++) {
        snowPos[i * 3] = (Math.random() - 0.5) * 40;
        snowPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 1;
        iceSnowSpeeds[i] = 0.1 + Math.random() * 0.2;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    iceSnowPoints = new THREE.Points(snowGeo, new THREE.PointsMaterial({
        size: 0.15, color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending
    }));
    scene.add(iceSnowPoints);
}

// The Colossal Ice Qilin: every raw dimension/position below is the
// reference's value / 10, with the reference's own group scale (4.0)
// kept as-is on top, so the final on-screen proportions match exactly.
function buildIceQilin() {
    iceQilinGroup = new THREE.Group();
    iceQilinGroup.position.set(0, -3.5, -13);
    iceQilinGroup.scale.set(4.0, 4.0, 4.0);
    scene.add(iceQilinGroup);
    iceQilinLegs = [];
    iceQilinTailSegments = [];

    const qilinMainTex = generateIceTexture('#b0e2ff', '#4682b4', true);
    const qilinCrystalTex = generateIceTexture('#ffffff', '#00ffff', false);

    const skinMat = new THREE.MeshStandardMaterial({
        map: qilinMainTex,
        bumpMap: qilinMainTex,
        bumpScale: 10.0,
        color: 0xd0f0ff,
        emissive: 0x226688,
        roughness: 0.05,
        metalness: 0.3,
        flatShading: true
    });
    const crystalMat = new THREE.MeshStandardMaterial({
        map: qilinCrystalTex,
        color: 0xaaffff,
        emissive: 0x00ffff,
        emissiveIntensity: 6.0,
        roughness: 0.0,
        metalness: 1.0,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    // Body
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 3.4), skinMat);
    iceQilinGroup.add(bodyMesh);

    // Glowing back spikes
    for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 4), crystalMat);
        spike.position.set(0, 0.9, 1.2 - i * 0.6);
        spike.rotation.x = -0.7;
        iceQilinGroup.add(spike);
    }

    // Neck, head, snout
    const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.9), skinMat);
    neckMesh.position.set(0, 0.6, 1.7);
    neckMesh.rotation.x = -1.0;
    iceQilinGroup.add(neckMesh);

    iceQilinHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.4), skinMat);
    iceQilinHead.position.set(0, 1.3, 2.5);
    iceQilinHead.rotation.x = 0.2;
    iceQilinGroup.add(iceQilinHead);

    iceQilinSnout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.0), skinMat);
    iceQilinSnout.position.set(0, 1.15, 3.2);
    iceQilinSnout.rotation.x = 0.2;
    iceQilinGroup.add(iceQilinSnout);

    // Crystal antlers
    const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 2.5, 6), crystalMat);
    antL.position.set(0.4, 2.3, 2.3); antL.rotation.set(-1.2, 0.2, -0.2); iceQilinGroup.add(antL);
    const antR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 2.5, 6), crystalMat);
    antR.position.set(-0.4, 2.3, 2.3); antR.rotation.set(-1.2, -0.2, 0.2); iceQilinGroup.add(antR);

    // Glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.1), eyeMat);
    eyeL.position.set(0.41, 1.4, 2.7); eyeL.rotation.y = Math.PI / 2; eyeL.rotation.z = -0.2; iceQilinGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.1), eyeMat);
    eyeR.position.set(-0.41, 1.4, 2.7); eyeR.rotation.y = -Math.PI / 2; eyeR.rotation.z = 0.2; iceQilinGroup.add(eyeR);

    // Cheek tufts
    for (let i = 0; i < 3; i++) {
        const tuftL = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 4), crystalMat);
        tuftL.position.set(0.5, 1.1 - i * 0.3, 1.9 + i * 0.2);
        tuftL.rotation.set(1.0, 0, 0.5);
        iceQilinGroup.add(tuftL);
        const tuftR = tuftL.clone();
        tuftR.position.x = -0.5;
        tuftR.rotation.z = -0.5;
        iceQilinGroup.add(tuftR);
    }

    // Crystal tail
    iceQilinTailGroup = new THREE.Group();
    iceQilinTailGroup.position.set(0, 0.3, -1.6);
    iceQilinGroup.add(iceQilinTailGroup);
    for (let i = 0; i < 8; i++) {
        const seg = new THREE.Mesh(new THREE.ConeGeometry(0.25 - i * 0.03, 1.2, 4), crystalMat);
        seg.position.set(0, -i * 0.5, -i * 0.5);
        seg.rotation.x = -1.4;
        iceQilinTailGroup.add(seg);
        iceQilinTailSegments.push(seg);
    }

    // Four legs
    const legPositions = [[0.7, -0.5, 1.2], [-0.7, -0.5, 1.2], [0.7, -0.5, -1.2], [-0.7, -0.5, -1.2]];
    legPositions.forEach(p => {
        const legGroup = new THREE.Group();
        legGroup.position.set(p[0], p[1], p[2]);
        iceQilinGroup.add(legGroup);

        const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 1.8, 6), skinMat);
        limb.position.y = -0.9;
        const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), crystalMat);
        hoof.position.y = -1.85; hoof.position.z = 0.1;
        const knee = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), crystalMat);
        knee.position.set(0, -0.5, 0.25); knee.rotation.x = 1.5;
        const shinSpike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), crystalMat);
        shinSpike.position.set(0, -1.3, 0.2); shinSpike.rotation.x = 1.0;

        legGroup.add(limb, hoof, knee, shinSpike);
        iceQilinLegs.push(legGroup);
    });

    // Rising snow-aura particles trailing off the qilin's body
    iceQilinAuraCount = 1000;
    const qAuraGeo = new THREE.BufferGeometry();
    const qAuraPos = new Float32Array(iceQilinAuraCount * 3);
    for (let i = 0; i < iceQilinAuraCount; i++) {
        qAuraPos[i * 3] = (Math.random() - 0.5) * 8;
        qAuraPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        qAuraPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    qAuraGeo.setAttribute('position', new THREE.BufferAttribute(qAuraPos, 3));
    iceQilinAura = new THREE.Points(qAuraGeo, new THREE.PointsMaterial({
        size: 0.3, color: 0x88ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
    }));
    iceQilinGroup.add(iceQilinAura);
}

// ===========================================
// Golden Dragon Thunder Arena (map2 background cast)
// Ported from "thunder_god_background_gold_version.html", all positions/
// sizes/speeds divided by 10 to match this file's compact arena scale
// (same convention used for the Ice-God Arena above). The reference pillars
// cut a dragon-carved pillar texture out of an external photo that isn't
// available here, so the pillars below use a plain stylised golden pillar
// mesh instead, keeping the spiral aura + accent clouds which don't need it.
// ===========================================

// Heavenly gold-white clouds, static (the reference deliberately keeps
// them still rather than animating them).
function buildGoldClouds() {
    goldCloudGroup = new THREE.Group();
    scene.add(goldCloudGroup);

    const cloudGeo = new THREE.SphereGeometry(1, 16, 16);
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xaa8822,
        emissiveIntensity: 0.5,
        roughness: 0.9,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
    });

    for (let i = 0; i < 60; i++) {
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        const cx = (Math.random() - 0.5) * 26;
        const cy = 5 + Math.random() * 2;
        const cz = (Math.random() - 0.5) * 14 - 8;
        cloud.position.set(cx, cy, cz);
        const scaleBase = 1.0 + Math.random() * 1.3;
        cloud.scale.set(scaleBase * 1.6, scaleBase * 0.4, scaleBase);
        goldCloudGroup.add(cloud);
    }
}

// Seven sacred golden pillars arranged in an arc behind the arena, each with
// a spinning golden-helix aura and small accent clouds at top/bottom.
function buildGoldPillars() {
    goldPillars = [];
    const pillarGroup = new THREE.Group();
    scene.add(pillarGroup);

    const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xeeddaa,
        emissive: 0xffaa00,
        emissiveIntensity: 0.25,
        roughness: 0.4,
        metalness: 0.5
    });
    const smallCloudGeo = new THREE.SphereGeometry(1, 10, 10);
    const smallCloudMat = new THREE.MeshStandardMaterial({
        color: 0xfff6dd, emissive: 0xcc9933, emissiveIntensity: 0.4,
        transparent: true, opacity: 0.6, depthWrite: false
    });

    const numPillars = 7;
    for (let i = 0; i < numPillars; i++) {
        const angle = (i / (numPillars - 1)) * Math.PI - Math.PI;
        const radius = 15;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * (radius * 0.5) - 13;
        const py = 2;

        const singlePillarGroup = new THREE.Group();
        singlePillarGroup.position.set(px, py, pz);

        // Plain stylised pillar (tapered box) standing in for the reference's
        // photo-cutout pillar, since that source image isn't available here.
        const pillarMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9, 1.6), pillarMat);
        singlePillarGroup.add(pillarMesh);
        const pillarCap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.0), pillarMat);
        pillarCap.position.y = 4.6;
        singlePillarGroup.add(pillarCap);

        // Golden helix aura spiralling up the pillar
        const spiralPoints = [];
        const spiralRadius = 1.0;
        const spiralHeight = 7.0;
        const startY = -3.5;
        const turns = 5;
        const segments = 60;
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI * 2 * turns;
            const sx = Math.cos(theta) * spiralRadius;
            const sz = Math.sin(theta) * spiralRadius;
            const sy = startY + (spiralHeight * (j / segments));
            spiralPoints.push(new THREE.Vector3(sx, sy, sz));
        }
        const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
        const spiralGeo = new THREE.TubeGeometry(spiralCurve, 60, 0.09, 6, false);
        const spiralMat = new THREE.MeshBasicMaterial({
            color: 0xffdd44, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending
        });
        const spiralMesh = new THREE.Mesh(spiralGeo, spiralMat);
        singlePillarGroup.add(spiralMesh);

        // Small still gold-white clouds hugging the top and base
        for (let k = 0; k < 3; k++) {
            const smCloud = new THREE.Mesh(smallCloudGeo, smallCloudMat);
            smCloud.position.set((Math.random() - 0.5) * 0.8, 3.6, (Math.random() - 0.5) * 0.8);
            const scale = 0.5 + Math.random() * 0.3;
            smCloud.scale.set(scale, scale * 0.5, scale);
            singlePillarGroup.add(smCloud);
        }
        for (let k = 0; k < 3; k++) {
            const smCloud = new THREE.Mesh(smallCloudGeo, smallCloudMat);
            smCloud.position.set((Math.random() - 0.5) * 0.9, -3.7, (Math.random() - 0.5) * 0.9);
            const scale = 0.6 + Math.random() * 0.4;
            smCloud.scale.set(scale, scale * 0.5, scale);
            singlePillarGroup.add(smCloud);
        }

        pillarGroup.add(singlePillarGroup);
        goldPillars.push({ spiral: spiralMesh });
    }
}

// Golden lightning pool floor beneath the arena (mirror-black base +
// wireframe energy-wave ripple), replaces the frost-lake shader used on
// map1's slot in the old shared floor system.
function buildGoldPool() {
    const poolGeo = new THREE.PlaneGeometry(60, 60, 60, 60);

    const poolBaseMat = new THREE.MeshStandardMaterial({ color: 0x070400, roughness: 0.04, metalness: 1.0 });
    const poolBase = new THREE.Mesh(poolGeo, poolBaseMat);
    poolBase.rotation.x = -Math.PI / 2;
    poolBase.position.y = -2.35;
    scene.add(poolBase);

    const poolEnergyMat = new THREE.MeshBasicMaterial({
        color: 0xffbb00, wireframe: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending
    });
    goldPoolEnergy = new THREE.Mesh(poolGeo, poolEnergyMat);
    goldPoolEnergy.rotation.x = -Math.PI / 2;
    goldPoolEnergy.position.y = -2.3;
    scene.add(goldPoolEnergy);
}

// Reverse-gravity gold sparks rising from the pool up toward the clouds.
function buildGoldSparkParticles() {
    goldSparkCount = 700;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(goldSparkCount * 3);
    for (let i = 0; i < goldSparkCount * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 40;
        pos[i + 1] = -1.8 + Math.random() * 9;
        pos[i + 2] = (Math.random() - 0.5) * 30 - 12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    goldSparkPoints = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.09, color: 0xffd24d, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(goldSparkPoints);
}

// The Ancient Celestial Gold Dragon, coiling in a weaving path around the
// sacred pillars (its per-frame path math lives in game.js's animate3D()).
function buildGoldDragon() {
    goldDragonGroup = new THREE.Group();
    scene.add(goldDragonGroup);
    goldDragonSegments = [];

    const numSegments = 28;
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.85, 10);
    bodyGeo.rotateX(Math.PI / 2);

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00, emissive: 0x994400, emissiveIntensity: 1.6, roughness: 0.15, metalness: 1.0
    });
    const auraMat = new THREE.MeshBasicMaterial({
        color: 0xffea75, wireframe: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < numSegments; i++) {
        const segmentGroup = new THREE.Group();
        let scale = 1.0 - (i / numSegments) * 0.85;
        if (i === 0) scale = 1.35;

        if (i === 0) {
            const headGeo = new THREE.BoxGeometry(0.9, 0.68, 1.35);
            const headMesh = new THREE.Mesh(headGeo, bodyMat);
            segmentGroup.add(headMesh);

            const hornGeo = new THREE.ConeGeometry(0.1, 1.1, 8);
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffeedd, roughness: 0.1 });
            const hornL = new THREE.Mesh(hornGeo, hornMat);
            hornL.position.set(0.32, 0.56, -0.24);
            hornL.rotation.set(-Math.PI / 4, 0, -Math.PI / 8);
            segmentGroup.add(hornL);
            const hornR = new THREE.Mesh(hornGeo, hornMat);
            hornR.position.set(-0.32, 0.56, -0.24);
            hornR.rotation.set(-Math.PI / 4, 0, Math.PI / 8);
            segmentGroup.add(hornR);

            const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.4, 0.12, 0.44); segmentGroup.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.4, 0.12, 0.44); segmentGroup.add(eyeR);
        } else {
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            const auraMesh = new THREE.Mesh(bodyGeo, auraMat);
            auraMesh.scale.set(1.22, 1.22, 1.22);
            segmentGroup.add(bodyMesh);
            segmentGroup.add(auraMesh);
        }

        segmentGroup.scale.set(scale, scale, scale);
        goldDragonGroup.add(segmentGroup);
        goldDragonSegments.push(segmentGroup);
    }
}

// Spawns one transient upward lightning bolt from the pool to the clouds.
// Called from game.js's animate3D() at a random chance each frame.
function spawnGoldLightningBolt() {
    const points = [];
    const startX = (Math.random() - 0.5) * 34;
    const startY = -1.8;
    const startZ = -6 - Math.random() * 14;

    const targetX = startX + (Math.random() - 0.5) * 10;
    const targetY = 6 + Math.random() * 3;
    const targetZ = startZ + (Math.random() - 0.5) * 8;

    let currentX = startX, currentY = startY, currentZ = startZ;
    points.push(new THREE.Vector3(currentX, currentY, currentZ));

    const segments = 14;
    for (let i = 1; i < segments; i++) {
        const ratio = i / segments;
        const tx = startX + (targetX - startX) * ratio;
        const ty = startY + (targetY - startY) * ratio;
        const tz = startZ + (targetZ - startZ) * ratio;
        currentX = tx + (Math.random() - 0.5) * 3.2;
        currentY = ty + (Math.random() - 0.5) * 0.8;
        currentZ = tz + (Math.random() - 0.5) * 3.2;
        points.push(new THREE.Vector3(currentX, currentY, currentZ));
    }
    points.push(new THREE.Vector3(targetX, targetY, targetZ));

    const boltGeom = new THREE.BufferGeometry().setFromPoints(points);
    const boltMat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending
    });
    const boltLine = new THREE.Line(boltGeom, boltMat);
    scene.add(boltLine);

    const poolFlash = new THREE.PointLight(0xffbb00, 8, 7);
    poolFlash.position.set(startX, startY + 0.2, startZ);
    scene.add(poolFlash);

    goldLightningBolts.push({ line: boltLine, light: poolFlash, life: 1.0, decay: 0.07 + Math.random() * 0.05 });

    if (goldSkyFlashLight) {
        goldSkyFlashLight.intensity = 5 + Math.random() * 4;
        goldSkyFlashLight.color.setHex(Math.random() > 0.4 ? 0xffcc00 : 0xffffff);
    }
}

        function build3DBoss(difficulty) {
            if (!is3DInitialized) return;
            // Clear existing
            while(bossGroup.children.length > 0){
                bossGroup.remove(bossGroup.children[0]);
            }

            // Void-glow color tier based on difficulty (rose = hardest, magenta = mid, violet = easy)
            const bossBaseColor = difficulty >= 5 ? 0xf43f5e : (difficulty >= 3 ? 0xd946ef : 0x8b5cf6);

            const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
            const voidMat = new THREE.MeshStandardMaterial({ color: bossBaseColor, emissive: bossBaseColor, emissiveIntensity: 2.5 });
            const armorMat = new THREE.MeshStandardMaterial({ color: 0x2d0a30, roughness: 0.4, metalness: 0.5 });

            const torsoGroup = new THREE.Group();
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.24), obsidianMat);
            torso.position.y = 0.65;
            torso.castShadow = true;
            torsoGroup.add(torso);

            const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.26), voidMat);
            core.position.set(0, 0.65, 0);
            torsoGroup.add(core);
            bossGroup.add(torsoGroup);

            const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.3), armorMat);
            shoulderL.position.set(-0.4, 0.8, 0);
            bossGroup.add(shoulderL);
            const shoulderR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.3), armorMat);
            shoulderR.position.set(0.4, 0.8, 0);
            bossGroup.add(shoulderR);

            // --- HOVERING OBSIDIAN FISTS ---
            const fistL = new THREE.Group();
            fistL.name = "boss_fist_L";
            fistL.position.set(-0.65, 0.3, 0.2);
            fistL.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), obsidianMat));
            fistL.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), voidMat));
            bossGroup.add(fistL);

            const fistR = new THREE.Group();
            fistR.name = "boss_fist_R";
            fistR.position.set(0.65, 0.3, 0.2);
            fistR.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), obsidianMat));
            fistR.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), voidMat));
            bossGroup.add(fistR);

            const headGroup = new THREE.Group();
            headGroup.position.set(0, 1.1, 0);
            headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), obsidianMat));

            const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), voidMat);
            eyeL.position.set(-0.1, 0.05, 0.19);
            headGroup.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), voidMat);
            eyeR.position.set(0.1, 0.05, 0.19);
            headGroup.add(eyeR);

            const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), armorMat);
            hornL.position.set(-0.14, 0.25, 0);
            headGroup.add(hornL);
            const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), armorMat);
            hornR.position.set(0.14, 0.25, 0);
            headGroup.add(hornR);
            bossGroup.add(headGroup);

            const skirt1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.2), armorMat);
            skirt1.position.y = 0.25;
            bossGroup.add(skirt1);
            const skirt2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.14), obsidianMat);
            skirt2.position.y = 0.05;
            bossGroup.add(skirt2);

            // Pulsing void aura
            const bossAura = new THREE.Mesh(
                new THREE.SphereGeometry(0.9, 16, 16),
                new THREE.MeshBasicMaterial({ color: bossBaseColor, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, wireframe: true })
            );
            bossAura.position.y = 0.6;
            bossAura.name = "bossAura";
            bossGroup.add(bossAura);

            // --- GLOWING MORNING STAR FLAIL WHEEL (4 spiked flails orbiting the boss) ---
            const wheelGroup = new THREE.Group();
            wheelGroup.name = "sword_wheel";
            wheelGroup.position.set(0, 0.55, -0.3);

            const flailCount = 4;
            const chainMat = new THREE.MeshStandardMaterial({ color: 0x221c2b, roughness: 0.8 });
            const ballMat = new THREE.MeshStandardMaterial({ color: 0x11081a, roughness: 0.3, metalness: 0.8 });
            const spikeGlowMat = new THREE.MeshBasicMaterial({ color: bossBaseColor });

            for (let i = 0; i < flailCount; i++) {
                const flailGroup = new THREE.Group();

                // Chain (4 tiny linked blocks)
                for (let c = 0; c < 4; c++) {
                    const link = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.14), chainMat);
                    link.position.set(0, 0.12 + c * 0.12, 0);
                    flailGroup.add(link);
                }

                // Morning Star ball with spikes on 6 cardinal axes
                const ballGroup = new THREE.Group();
                ballGroup.position.set(0, 0.65, 0);

                const ballCore = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), ballMat);
                ballGroup.add(ballCore);

                const directions = [
                    [0.16, 0, 0, 0, 0, -Math.PI / 2],
                    [-0.16, 0, 0, 0, 0, Math.PI / 2],
                    [0, 0.16, 0, 0, 0, 0],
                    [0, -0.16, 0, Math.PI, 0, 0],
                    [0, 0, 0.16, Math.PI / 2, 0, 0],
                    [0, 0, -0.16, -Math.PI / 2, 0, 0]
                ];

                directions.forEach(dir => {
                    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), spikeGlowMat);
                    spike.position.set(dir[0], dir[1], dir[2]);
                    spike.rotation.set(dir[3], dir[4], dir[5]);
                    ballGroup.add(spike);
                });

                flailGroup.add(ballGroup);

                // Distribute flails evenly around the boss
                const angle = (i / flailCount) * Math.PI * 2;
                flailGroup.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0);
                flailGroup.rotation.z = angle - Math.PI / 2;

                wheelGroup.add(flailGroup);
            }
            bossGroup.add(wheelGroup);
        }

// ===== Stage / substage navigation & battle entry (moved from game.js) =====
        async function goToCategorySelect() {
            playSynthSound('click');
            document.getElementById("screenCharSelect").classList.add("hidden");
            document.getElementById("screenSubStageSelect").classList.add("hidden");
            document.getElementById("screenBattle").classList.add("hidden");
            document.getElementById("screenCategorySelect").classList.remove("hidden");
            
            const charInfo = CHARACTERS[gameState.user.selectedCharacter];
            const headerAvatarContainer = document.getElementById("headerAvatarContainer");
            headerAvatarContainer.className = `w-8 h-8 rounded-lg bg-slate-900 border border-${charInfo.themeColor}-400 flex items-center justify-center font-bold text-${charInfo.themeColor}-400 shadow-lg`;
            headerAvatarContainer.textContent = charInfo.name.substring(0, 2).toUpperCase();

            // เผื่อกรณี API โหลดข้อมูลด่านยังไม่เสร็จ (เช่นเน็ตช้า) รอให้เสร็จก่อนค่อยแสดงรายการด่าน
            const container = document.getElementById("categoriesGrid");
            if (Object.keys(STAGES_DATA).length === 0) {
                container.innerHTML = `<p class="text-slate-500 text-xs col-span-full text-center py-10">⏳ กำลังโหลดข้อมูลด่าน...</p>`;
                await stagesDataLoadedPromise;
            }

            renderCategoryList();
        }

        function backToCategories() {
            goToCategorySelect();
        }

        function renderCategoryList() {
            const container = document.getElementById("categoriesGrid");
            container.innerHTML = "";

            const totalSubstages = 13 * 3;
            const clearedCount = gameState.user.clearedSubStages.length;
            
            const percentProgress = Math.round((clearedCount / totalSubstages) * 100);
            document.getElementById("globalProgressPercentText").textContent = `${percentProgress}% COMPLETED (${clearedCount}/${totalSubstages})`;
            document.getElementById("globalProgressRoadmapBar").style.width = `${percentProgress}%`;

            Object.keys(STAGES_DATA).forEach(catId => {
                const category = STAGES_DATA[catId];
                
                let categoryClearedCount = 0;
                category.subStages.forEach(sub => {
                    if (gameState.user.clearedSubStages.includes(`${catId}-${sub.id}`)) {
                        categoryClearedCount++;
                    }
                });

                const isFullyMastered = (categoryClearedCount === 3);

                const cardHtml = `
                    <div id="catCard-${catId}" onclick="enterCategory(${catId})" class="relative group cursor-pointer flex flex-col justify-between bg-slate-900/40 rounded-2xl p-5 border ${isFullyMastered ? 'border-amber-500/30 bg-amber-950/5' : 'border-white/5 hover:border-cyan-500/40'} hover:scale-[1.02] transition-all duration-250">
                        ${isFullyMastered ? '<div class="absolute -top-3 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[8px] px-2.5 py-0.5 rounded-full font-bold border border-amber-300 shadow-xl z-10 uppercase tracking-widest">MASTERED</div>' : ''}
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">STAGE ${String(catId).padStart(2, '0')}</span>
                                <span class="text-[10px] font-semibold text-slate-400"><i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> ${categoryClearedCount}/3 เคลียร์</span>
                            </div>
                            <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">${category.title}</h3>
                            <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">${category.desc}</p>
                        </div>
                        <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span class="text-[9px] text-slate-500 uppercase font-bold tracking-widest">เข้าดวลย่อย</span>
                            <div class="flex space-x-1.5">
                                <span class="w-2.5 h-2.5 rounded-full ${categoryClearedCount >= 1 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/40' : 'bg-slate-800'}"></span>
                                <span class="w-2.5 h-2.5 rounded-full ${categoryClearedCount >= 2 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/40' : 'bg-slate-800'}"></span>
                                <span class="w-2.5 h-2.5 rounded-full ${categoryClearedCount >= 3 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/40' : 'bg-slate-800'}"></span>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML("beforeend", cardHtml);
            });
        }

        // ===== Dashboard screen (progress/score/character overview) =====
        let dashFocusCatId = null; // catId currently shown in the "STAGE FOCUS REPORT" panel

        function openDashboard() {
            playSynthSound('click');
            document.getElementById("screenCategorySelect").classList.add("hidden");
            document.getElementById("screenDashboard").classList.remove("hidden");
            switchDashboardTab('stages');
            renderDashboard();
        }

        function closeDashboard() {
            playSynthSound('click');
            document.getElementById("screenDashboard").classList.add("hidden");
            document.getElementById("screenCategorySelect").classList.remove("hidden");
        }

        function switchDashboardTab(tab) {
            const stagesBtn = document.getElementById("dashTabStages");
            const charsBtn = document.getElementById("dashTabCharacters");
            const lbBtn = document.getElementById("dashTabLeaderboard");
            const stagesContent = document.getElementById("dashStagesContent");
            const charsContent = document.getElementById("dashCharactersContent");
            const lbContent = document.getElementById("dashLeaderboardContent");

            const activeCls = "px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white";
            const inactiveCls = "px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 text-slate-400 hover:text-slate-200";

            stagesContent.classList.add("hidden");
            charsContent.classList.add("hidden");
            lbContent.classList.add("hidden");
            stagesBtn.className = inactiveCls;
            charsBtn.className = inactiveCls;
            lbBtn.className = inactiveCls;

            if (tab === 'characters') {
                charsContent.classList.remove("hidden");
                charsBtn.className = activeCls;
            } else if (tab === 'leaderboard') {
                lbContent.classList.remove("hidden");
                lbBtn.className = activeCls;
                fetchAndRenderLeaderboard();
            } else {
                stagesContent.classList.remove("hidden");
                stagesBtn.className = activeCls;
            }
        }

        // ===== Leaderboard tab: ranks all registered players by XP =====
        // ต้องมี backend endpoint GET {API_BASE_URL}/leaderboard ที่ตอบกลับเป็น:
        //   { leaderboard: [ { username, displayName, xp, level, clearedSubStages: [...], selectedCharacter }, ... ] }
        // เรียงจากคะแนนมากไปน้อยฝั่ง backend หรือฝั่งนี้ก็ได้ (ฝั่งนี้จะ sort ซ้ำให้เผื่อไว้)
        async function fetchAndRenderLeaderboard() {
            const loadingEl = document.getElementById("dashLeaderboardLoading");
            const errorEl = document.getElementById("dashLeaderboardError");
            const errorMsgEl = document.getElementById("dashLeaderboardErrorMsg");
            const tableWrap = document.getElementById("dashLeaderboardTableWrap");
            const rowsContainer = document.getElementById("dashLeaderboardRows");

            loadingEl.classList.remove("hidden");
            errorEl.classList.add("hidden");
            tableWrap.classList.add("hidden");

            const token = localStorage.getItem(TOKEN_STORAGE_KEY);

            try {
                const res = await fetch(`${API_BASE_URL}/leaderboard`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {}
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error("ยังไม่มีระบบบิลบอร์ดฝั่ง backend (ต้องเพิ่ม endpoint GET /leaderboard ก่อน)");
                    }
                    throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
                }

                const data = await res.json();
                let list = data.leaderboard || [];

                // เรียงจาก XP มาก -> น้อย (เผื่อ backend ยังไม่ได้ sort มาให้)
                list = list.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0));

                if (list.length === 0) {
                    throw new Error("ยังไม่มีผู้เล่นในบิลบอร์ด");
                }

                rowsContainer.innerHTML = "";
                const myUsername = (gameState.user.username || "").toLowerCase();

                list.forEach((entry, idx) => {
                    const rank = idx + 1;
                    const isMe = entry.username && entry.username.toLowerCase() === myUsername;

                    let rankBadge;
                    if (rank === 1) rankBadge = `<span class="bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg"><i class="fa-solid fa-crown mr-1"></i>1ST</span>`;
                    else if (rank === 2) rankBadge = `<span class="bg-slate-300 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg">2ND</span>`;
                    else if (rank === 3) rankBadge = `<span class="bg-amber-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">3RD</span>`;
                    else rankBadge = `<span class="text-slate-500 text-[10px] font-bold px-2.5">${rank}TH</span>`;

                    // หาด่านล่าสุดที่ผู้เล่นคนนี้เคลียร์ (catId มากที่สุดที่มีใน clearedSubStages)
                    let latestStageText = "-";
                    const cleared = entry.clearedSubStages || [];
                    if (cleared.length > 0) {
                        const catIdsCleared = cleared.map(key => parseInt(key.split("-")[0], 10)).filter(n => !isNaN(n));
                        if (catIdsCleared.length > 0) {
                            const maxCat = Math.max(...catIdsCleared);
                            const cat = STAGES_DATA[maxCat];
                            latestStageText = cat ? `ด่านที่ ${maxCat}: ${cat.title}` : `ด่านที่ ${maxCat}`;
                        }
                    }

                    const char = CHARACTERS[entry.selectedCharacter];
                    const charText = char ? char.name : "-";

                    const rowHtml = `
                        <tr class="border-b border-white/5 ${isMe ? 'bg-cyan-950/20' : ''}">
                            <td class="py-3 px-3">${rankBadge}</td>
                            <td class="py-3 px-3 font-bold ${isMe ? 'text-cyan-300' : 'text-white'}">
                                <i class="fa-solid fa-circle-user text-slate-600 mr-1.5"></i>${entry.displayName || entry.username}${isMe ? ' <span class="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded ml-1">คุณ</span>' : ''}
                            </td>
                            <td class="py-3 px-3 text-slate-400">${latestStageText}</td>
                            <td class="py-3 px-3 text-slate-400">${charText}</td>
                            <td class="py-3 px-3 text-right font-black ${isMe ? 'text-cyan-300' : 'text-white'}">${(entry.xp || 0).toLocaleString()} XP</td>
                        </tr>`;
                    rowsContainer.insertAdjacentHTML("beforeend", rowHtml);
                });

                loadingEl.classList.add("hidden");
                tableWrap.classList.remove("hidden");
            } catch (err) {
                console.warn("[Leaderboard] โหลดไม่สำเร็จ:", err.message);
                loadingEl.classList.add("hidden");
                errorMsgEl.textContent = err.message || "โหลดข้อมูลบิลบอร์ดไม่สำเร็จ";
                errorEl.classList.remove("hidden");
            }
        }

        function dashEnterFocusStage() {
            if (dashFocusCatId === null) return;
            closeDashboard();
            enterCategory(dashFocusCatId);
        }

        function renderDashboard() {
            const totalSubstages = 13 * 3;
            const clearedCount = gameState.user.clearedSubStages.length;
            const percentProgress = Math.round((clearedCount / totalSubstages) * 100);

            document.getElementById("dashGlobalProgressText").textContent = `${percentProgress}% (${clearedCount}/${totalSubstages})`;
            document.getElementById("dashGlobalProgressBar").style.width = `${percentProgress}%`;

            // XP / Level card (level-up formula: 100 XP per level, matches updateHeaderXp())
            const neededXp = 100;
            document.getElementById("dashScoreCounter").textContent = gameState.user.xp.toLocaleString();
            document.getElementById("dashLevelBadge").innerHTML = `<i class="fa-solid fa-bolt mr-1"></i> LV.${gameState.user.level}`;
            document.getElementById("dashXpCurrent").textContent = gameState.user.xp;
            document.getElementById("dashXpNeeded").textContent = neededXp;
            document.getElementById("dashXpProgressBar").style.width = `${Math.min(100, Math.round((gameState.user.xp / neededXp) * 100))}%`;

            // --- Per-category breakdown + find current (first unfinished) stage ---
            const catIds = Object.keys(STAGES_DATA);
            let masteredCount = 0;
            let currentStage = null;
            const stagesListContainer = document.getElementById("dashStagesListContainer");
            const ticksContainer = document.getElementById("dashStageTicksContainer");
            stagesListContainer.innerHTML = "";
            ticksContainer.innerHTML = "";

            catIds.forEach(catId => {
                const category = STAGES_DATA[catId];
                let categoryClearedCount = 0;
                category.subStages.forEach(sub => {
                    if (gameState.user.clearedSubStages.includes(`${catId}-${sub.id}`)) {
                        categoryClearedCount++;
                    }
                });
                const isFullyMastered = (categoryClearedCount === 3);
                const isStarted = (categoryClearedCount > 0);
                if (isFullyMastered) masteredCount++;
                if (!isFullyMastered && !currentStage) {
                    currentStage = { catId, category, categoryClearedCount };
                }

                ticksContainer.insertAdjacentHTML("beforeend",
                    `<span class="w-2.5 h-2.5 rounded-full ${isFullyMastered ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow shadow-cyan-500/40' : (isStarted ? 'bg-amber-500/60' : 'bg-slate-800')}"></span>`);

                const statusBadge = isFullyMastered
                    ? `<span class="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase flex-shrink-0">ผ่านแล้ว</span>`
                    : (isStarted ? `<span class="bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase flex-shrink-0">กำลังเล่น</span>`
                                  : `<span class="bg-slate-900 border border-white/5 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase flex-shrink-0">ยังไม่เริ่ม</span>`);

                const rowHtml = `
                    <div onclick="dashFocusOnStage(${catId})" class="cursor-pointer flex items-center gap-3 bg-slate-900/40 border ${isFullyMastered ? 'border-amber-500/30' : 'border-white/5 hover:border-cyan-500/30'} rounded-xl p-3.5 transition">
                        <div class="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center border ${isFullyMastered ? 'border-amber-400 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-950/60 text-slate-500'}">
                            <i class="fa-solid ${isFullyMastered ? 'fa-crown' : 'fa-scroll'} text-xs"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <span class="text-[9px] font-bold uppercase tracking-widest ${isFullyMastered ? 'text-amber-400' : 'text-slate-500'}">STAGE ${String(catId).padStart(2, '0')}</span>
                            <p class="text-xs font-bold text-white truncate">${category.title}</p>
                        </div>
                        ${statusBadge}
                        <span class="text-[10px] font-bold text-slate-400 flex-shrink-0 w-8 text-right">${categoryClearedCount}/3</span>
                        <i class="fa-solid fa-chevron-right text-slate-600 text-[10px] flex-shrink-0"></i>
                    </div>`;
                stagesListContainer.insertAdjacentHTML("beforeend", rowHtml);
            });

            document.getElementById("dashMasteredRatio").textContent = `${masteredCount} / ${catIds.length}`;
            document.getElementById("dashMasteredPercent").textContent = catIds.length ? `${Math.round((masteredCount / catIds.length) * 100)}%` : "0%";

            if (currentStage) {
                const nextSub = currentStage.category.subStages[currentStage.categoryClearedCount];
                document.getElementById("dashCurrentStageName").textContent = currentStage.category.title;
                document.getElementById("dashCurrentStageSub").textContent = nextSub ? `ศัตรูถัดไป: ${nextSub.bossName}` : `เคลียร์แล้ว ${currentStage.categoryClearedCount}/3`;
                document.getElementById("dashCurrentStageDifficulty").textContent = nextSub ? nextSub.difficulty : "-";
                dashFocusOnStage(currentStage.catId);
            } else {
                document.getElementById("dashCurrentStageName").textContent = "พิชิตครบทุกด่านแล้ว! 🎉";
                document.getElementById("dashCurrentStageSub").textContent = "สุดยอดนักสู้แห่งสมรภูมิ K.O.QUIZZ";
                document.getElementById("dashCurrentStageDifficulty").textContent = "-";
                if (catIds.length) dashFocusOnStage(catIds[0]);
            }

            // --- Character roster ---
            const totalCleared = clearedCount;
            const charsGrid = document.getElementById("dashCharactersGrid");
            charsGrid.innerHTML = "";
            const charKeys = Object.keys(CHARACTERS);
            let unlockedChars = 0;

            charKeys.forEach(charKey => {
                const char = CHARACTERS[charKey];
                const isLocked = totalCleared < char.unlockedAt;
                if (!isLocked && !char.comingSoon) unlockedChars++;

                const cardHtml = char.comingSoon || isLocked
                    ? `
                    <div class="flex flex-col items-center text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-3 opacity-50">
                        <div class="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-xl border border-slate-800 mb-2">
                            <i class="fa-solid ${char.comingSoon ? 'fa-person-circle-question' : 'fa-lock'} text-slate-600 text-sm"></i>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500 truncate w-full">${char.name}</span>
                        <span class="text-[9px] text-slate-600 mt-0.5">${char.comingSoon ? 'เร็วๆ นี้' : `อีก ${char.unlockedAt - totalCleared} ด่าน`}</span>
                    </div>`
                    : `
                    <div class="flex flex-col items-center text-center bg-slate-900/60 rounded-xl border border-${char.themeColor}-500/30 p-3">
                        <div class="w-10 h-10 bg-${char.themeColor}-500/10 text-${char.themeColor}-400 flex items-center justify-center rounded-xl border border-${char.themeColor}-500/30 mb-2">
                            <i class="fa-solid fa-user-shield text-sm"></i>
                        </div>
                        <span class="text-[10px] font-bold text-white truncate w-full">${char.name}</span>
                        <span class="text-[9px] text-emerald-400 mt-0.5">ปลดล็อกแล้ว</span>
                    </div>`;
                charsGrid.insertAdjacentHTML("beforeend", cardHtml);
            });

            document.getElementById("dashCharsUnlockedCount").textContent = unlockedChars;
            document.getElementById("dashCharsTotalCount").textContent = charKeys.filter(k => !CHARACTERS[k].comingSoon).length;
        }

        // Populates the right-hand "STAGE FOCUS REPORT" panel for a given category
        function dashFocusOnStage(catId) {
            const category = STAGES_DATA[catId];
            if (!category) return;
            dashFocusCatId = catId;

            let categoryClearedCount = 0;
            category.subStages.forEach(sub => {
                if (gameState.user.clearedSubStages.includes(`${catId}-${sub.id}`)) categoryClearedCount++;
            });
            const nextSub = category.subStages[categoryClearedCount];

            document.getElementById("dashFocusStageTitle").textContent = category.title;
            document.getElementById("dashFocusStageSubtitle").textContent = nextSub ? nextSub.bossName : "เคลียร์ครบทุกเลเวลแล้ว";
            document.getElementById("dashFocusStageEnemy").textContent = nextSub ? `เลเวล ${categoryClearedCount + 1}/3` : "🏆 MASTERED";
            document.getElementById("dashFocusStageCleared").textContent = `${categoryClearedCount}/3`;
            document.getElementById("dashFocusStageDifficulty").textContent = nextSub ? nextSub.difficulty : "-";

            const btn = document.getElementById("dashFocusStageBtn");
            if (nextSub) {
                btn.classList.remove("opacity-50", "pointer-events-none");
                btn.innerHTML = `<i class="fa-solid fa-hand-fist"></i> ท้าทายด่านนี้เลย!`;
            } else {
                btn.classList.add("opacity-50", "pointer-events-none");
                btn.innerHTML = `<i class="fa-solid fa-check"></i> เคลียร์ครบแล้ว`;
            }
        }

        function enterCategory(catId) {
            playSynthSound('click');
            gameState.selectedCategoryId = catId;
            
            const category = STAGES_DATA[catId];
            document.getElementById("subStageCategoryTitle").innerHTML = `<i class="fa-solid fa-scroll mr-2 text-cyan-400"></i> ${category.title}`;

            document.getElementById("screenCategorySelect").classList.add("hidden");
            document.getElementById("screenSubStageSelect").classList.remove("hidden");

            renderSubStageList();
        }

        function backToSubStages() {
            document.getElementById("screenBattle").classList.add("hidden");
            document.getElementById("modalSurrender").classList.add("hidden");
            document.getElementById("modalDefeat").classList.add("hidden");
            document.getElementById("modalVictory").classList.add("hidden");
            
            document.getElementById("screenSubStageSelect").classList.remove("hidden");
            renderSubStageList();
        }

        function renderSubStageList() {
            const container = document.getElementById("subStagesContainer");
            container.innerHTML = "";

            const catId = gameState.selectedCategoryId;
            const category = STAGES_DATA[catId];

            category.subStages.forEach((sub, index) => {
                const subKey = `${catId}-${sub.id}`;
                const isCleared = gameState.user.clearedSubStages.includes(subKey);
                const isUnlocked = (index === 0 || gameState.user.clearedSubStages.includes(`${catId}-${sub.id - 1}`));

                let subHtml = "";

                if (!isUnlocked) {
                    subHtml = `
                        <div class="flex flex-col md:flex-row items-center justify-between bg-slate-950/20 p-5 rounded-2xl border border-dashed border-white/5 opacity-50 select-none">
                            <div class="flex items-center space-x-3.5">
                                <div class="bg-slate-900 p-3 rounded-xl text-slate-700 border border-slate-800">
                                    <i class="fa-solid fa-lock text-xl"></i>
                                </div>
                                <div>
                                    <span class="text-[9px] text-slate-600 block uppercase font-bold tracking-widest">LEVEL 0${sub.id}</span>
                                    <h4 class="text-base font-bold text-slate-500">${sub.name}</h4>
                                    <p class="text-xs text-slate-600 mt-0.5">⚠️ สยบระดับก่อนหน้า เพื่อคลี่คลายกลไกล็อคเลเวล</p>
                                </div>
                            </div>
                            <button disabled class="w-full md:w-auto mt-4 md:mt-0 px-6 py-2.5 bg-slate-950 text-slate-700 border border-white/5 text-[10px] font-bold rounded-xl cursor-not-allowed uppercase tracking-wider">
                                LOCKED 🔒
                            </button>
                        </div>
                    `;
                } else {
                    let starIcons = "";
                    for (let i = 0; i < 5; i++) {
                        if (i < sub.difficulty) {
                            starIcons += `<i class="fa-solid fa-star text-amber-400 text-xs mr-0.5"></i>`;
                        } else {
                            starIcons += `<i class="fa-regular fa-star text-slate-800 text-xs mr-0.5"></i>`;
                        }
                    }

                    subHtml = `
                        <div class="flex flex-col md:flex-row items-center justify-between bg-slate-900/50 p-5 rounded-2xl border ${isCleared ? 'border-amber-500/20 bg-amber-950/5' : 'border-white/5 hover:border-cyan-500/25'} transition duration-200">
                            <div class="flex items-center space-x-3.5">
                                <div class="bg-slate-950 border ${isCleared ? 'border-amber-500/30 text-amber-400' : 'border-cyan-500/10 text-cyan-400'} p-3.5 rounded-2xl shadow-xl">
                                    <i class="${sub.bossIcon} text-xl"></i>
                                </div>
                                <div>
                                    <div class="flex items-center space-x-2.5">
                                        <span class="text-[9px] font-bold ${isCleared ? 'text-amber-400' : 'text-cyan-400'} uppercase tracking-widest">LEVEL 0${sub.id}</span>
                                        <div class="flex">${starIcons}</div>
                                    </div>
                                    <h4 class="text-base font-bold text-white">${sub.name}</h4>
                                    <p class="text-xs text-slate-400 mt-0.5">
                                        <i class="fa-solid fa-skull text-rose-500/80 mr-1.5 text-[10px]"></i> ผู้คุมด่าน: <span class="text-rose-400 font-bold">${sub.bossName}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div class="w-full md:w-auto mt-4 md:mt-0 flex items-center space-x-3 justify-between md:justify-end">
                                ${isCleared ? '<span class="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest">CLEAR</span>' : ''}
                                <button onclick="startBattle(${sub.id})" class="px-6 py-2.5 bg-slate-950 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-indigo-500 border border-white/5 text-white text-[10px] font-bold rounded-xl transition shadow hover:shadow-cyan-500/10 uppercase tracking-wider">
                                    เริ่มศึกดวล ⚔️
                                </button>
                            </div>
                        </div>
                    `;
                }

                container.insertAdjacentHTML("beforeend", subHtml);
            });
        }

        function startBattle(subId) {
            playSynthSound('click');
            
            const catId = gameState.selectedCategoryId;
            const category = STAGES_DATA[catId];
            const sub = category.subStages.find(s => s.id === subId);

            gameState.currentSubStageIndex = subId;
            gameState.playerHp = 100;
            gameState.bossHp = 100;
            gameState.quizMode = true; // sync flag: tells attack.js's Yuehan skill fns
                                        // (triggerHeroHeal / triggerBossCounter) to call
                                        // loadNextQuestion() instead of falling back to the
                                        // old cinematic auto-loop
            updateHpBars();

            // Setup HTML view
            document.getElementById("screenSubStageSelect").classList.add("hidden");
            document.getElementById("screenBattle").classList.remove("hidden");

            // Build/re-build 3D Arena
            setTimeout(() => {
                if (!is3DInitialized || gameState.currentArenaMap !== gameState.user.selectedMap) {
                    init3DArena(gameState.user.selectedMap);
                }
                // Construct the 3D meshes based on choice
                build3DPlayer(gameState.user.selectedCharacter);
                build3DBoss(sub.difficulty);
            }, 100);

            // Active character settings
            const activeHeroKey = gameState.user.selectedCharacter;
            
            document.getElementById("playerNameDisplay").textContent = gameState.user.name;
            document.getElementById("playerTitleDisplay").textContent = gameState.user.title;

            document.getElementById("bossNameDisplay").textContent = sub.bossName;
            document.getElementById("bossTitleDisplay").textContent = `LEVEL 0${subId} BOSS`;

            document.getElementById("quizStageIndicator").textContent = category.title;
            document.getElementById("quizSubStageIndicator").textContent = sub.name;

            document.getElementById("learningActiveIndicator").classList.add("hidden");
            document.getElementById("perkHintBtn").classList.add("hidden");
            
            const activePerksContainer = document.getElementById("activePerkIcons");
            activePerksContainer.innerHTML = "";

            gameState.isShieldActive = false;
            gameState.isBossFrozen = false;
            gameState.isResurrectionAvailable = false;
            gameState.hintCount = 0;
            gameState.battleAnswerLog = [];

            if (activeHeroKey === 'yuehan') {
                document.getElementById("learningActiveIndicator").classList.remove("hidden");
                activePerksContainer.innerHTML = `<span id="hudFreezeIcon" class="hidden bg-sky-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">❄️ BOSS FROZEN</span>`;
            } else if (activeHeroKey === 'rin') {
                document.getElementById("perkHintBtn").classList.remove("hidden");
                document.getElementById("learningActiveIndicator").classList.remove("hidden");
                activePerksContainer.innerHTML = `<span class="bg-purple-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">🔮 HINT ACTIVE</span>`;
            } else if (activeHeroKey === 'giga') {
                gameState.isShieldActive = true;
                document.getElementById("learningActiveIndicator").classList.remove("hidden");
                activePerksContainer.innerHTML = `<span id="hudShieldIcon" class="bg-cyan-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">🛡️ SHIELD ACTIVE</span>`;
            } else if (activeHeroKey === 'aurora') {
                gameState.isResurrectionAvailable = true;
                document.getElementById("learningActiveIndicator").classList.remove("hidden");
                activePerksContainer.innerHTML = `<span id="hudAnkhIcon" class="bg-rose-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">💖 REVIVE OK</span>`;
            } else if (activeHeroKey === 'kenji') {
                activePerksContainer.innerHTML = `<span class="bg-amber-500 text-slate-950 text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">⚡ 1.5x XP</span>`;
            }

            prepareQuestions(catId, subId);
            document.getElementById("combatLogText").innerHTML = `เริ่มสมรภูมิ 3D ดวลกับ <span class="text-rose-400 font-bold">${sub.bossName}</span>! โจมตีและโดนโจมตีได้ 10 ครั้งพอดี!`;

            renderQuestion();
        }