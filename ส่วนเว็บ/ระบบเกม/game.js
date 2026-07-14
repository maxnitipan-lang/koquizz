// ===========================================
// game.js - Core game logic, 3D engine, UI, battle flow
// (requires data.js and character.js to be loaded first)
// ===========================================

        // ===========================================
        // STAGES_DATA ตอนนี้ไม่ได้มาจากไฟล์ data.js แบบ static อีกต่อไป
        // แต่โหลดมาจาก backend/MongoDB ผ่าน API ตอนเปิดเว็บ (ไม่มี "answer" ติดมาด้วย
        // เพื่อกันคนเปิด DevTools ดูเฉลย — เช็คคำตอบจะยิงไปถาม server แทนที่ฟังก์ชัน submitAnswer ด้านล่าง)
        // ===========================================
        let STAGES_DATA = {};
        let stagesDataLoadedPromise = null;

        function loadStagesData() {
            stagesDataLoadedPromise = fetch(`${API_BASE_URL}/stages`)
                .then(res => {
                    if (!res.ok) throw new Error("โหลดข้อมูลด่านไม่สำเร็จ");
                    return res.json();
                })
                .then(data => {
                    const result = {};
                    (data.stages || []).forEach(stage => {
                        result[stage.stageId] = {
                            title: stage.title,
                            desc: stage.desc,
                            subStages: (stage.subStages || []).map(sub => ({
                                id: sub.subStageId,
                                name: sub.name,
                                bossName: sub.bossName,
                                bossIcon: sub.bossIcon,
                                difficulty: sub.difficulty,
                                questions: (sub.questions || []).map(q => ({
                                    id: q.questionId,
                                    q: q.q,
                                    choices: q.choices
                                    // หมายเหตุ: ไม่มีฟิลด์ answer แล้ว ต้องเช็คผ่าน /verify เท่านั้น
                                }))
                            }))
                        };
                    });
                    STAGES_DATA = result;
                    console.log(`[Stages] โหลดข้อมูลด่านจาก API สำเร็จ (${Object.keys(STAGES_DATA).length} ด่าน)`);
                })
                .catch(err => {
                    console.error("[Stages] โหลดข้อมูลด่านไม่สำเร็จ:", err.message);
                    alert("โหลดข้อมูลคำถามไม่สำเร็จ กรุณาตรวจสอบว่า backend รันอยู่ที่ " + API_BASE_URL + " แล้วรีเฟรชหน้าใหม่");
                });
            return stagesDataLoadedPromise;
        }

        // หมายเหตุ: เรียก loadStagesData() จริงๆ ที่ window.onload ด้านล่างสุดของไฟล์
        // (ต้องรอให้ API_BASE_URL ถูกประกาศก่อน ไม่งั้นทั้งไฟล์จะ error ตั้งแต่ต้น)

        let gameState = {
            user: {
                name: "ผู้กล้าปัญญา",
                username: "",
                title: "นักกุนซือเรียนรู้",
                selectedCharacter: "yuehan",
                selectedMap: "map1", // 'map1' = ice arena (default), 'map2' = lava celestial arena, 'map3' = lightning god arena
                xp: 0,
                level: 1,
                clearedSubStages: JSON.parse(localStorage.getItem("koquizz_cleared_modern")) || []
            },
            selectedCategoryId: null,
            currentSubStageIndex: 0,
            currentQuestionPool: [],
            currentQuestionIndex: 0,
            usedQuestions: {}, 
            playerHp: 100,
            bossHp: 100,
            isSoundMuted: false,
            // Per battle runtime state variables
            isShieldActive: false,
            isBossFrozen: false,
            isResurrectionAvailable: false,
            hintCount: 0,
            battleAnswerLog: [],
            // Used by the Yuehan cinematic skill functions in attack.js
            quizMode: false,
            timeScale: 1,
            isActionInProgress: false
        };

        let audioCtx = null;
        
        // 3D Scene Global variables
        let scene, camera, renderer, threeDContainer;
        let playerGroup, bossGroup;
        let pointLight; // Reaction flash light
        let damageParticles = [];
        let divineSparks = []; // เหลย เจิ้น (character3): golden lightning trail sparks orbiting/rising around the player
        let activeProjectiles = []; // Yuehan's stone-rain / chakram-storm spell projectiles
        let lavaUniforms = { uTime: { value: 0 } }; // Uniforms to animate procedural ice-lake shader
        // Background 3D Elements for richer visual ambiance (Frost Celestial Arena, ported from ice mage arena)
        let godRay, godRayInner, moon, moonGlow, backgroundSparks;
        let slashArcMesh, shockwaveRingMesh; // Yuehan slash overlay + boss counter shockwave (built in map.js)
        let serpentSegments = []; // Giant voxel serpent decoration (built in map.js, used by map2/map3)
        let serpentGroup; // Parent group wrapping all serpent segments, so it can orbit as one

        // --- Ice-God Arena background cast (map1 only, built in map.js) ---
        let iceQilinGroup, iceQilinLegs = [], iceQilinHead, iceQilinSnout, iceQilinTailGroup, iceQilinTailSegments = [];
        let iceQilinAura, iceQilinAuraCount = 0;
        let iceTornados = []; // spinning snowstorm pillars flanking the arena
        let iceVortexPoints, iceVortexParticles = [], iceVortexCount = 0; // overhead swirling snow vortex
        let iceArenaAura, iceArenaAuraAngles = [], iceArenaAuraCount = 0; // particle ring hugging the frost dais
        let iceMagicRing; // rotating glyph ring on the dais
        let iceSnowPoints, iceSnowSpeeds, iceSnowCount = 0; // falling snow across the whole ice arena

        // --- Golden Dragon Thunder Arena background cast (map2 only, built in map.js) ---
        let goldCloudGroup; // static heavenly clouds, no per-frame animation needed
        let goldPillars = []; // { spiral } refs for the rotating golden helix aura per pillar
        let goldDragonGroup, goldDragonSegments = [];
        let goldPoolEnergy; // wireframe energy-wave mesh above the still pool base
        let goldSparkPoints, goldSparkCount = 0; // reverse-gravity gold sparks rising from the pool
        let goldLightningBolts = []; // transient upward lightning bolt lines + flash lights
        let goldSkyFlashLight;
        let mouseX = 0, mouseY = 0;
        let targetPlayerPos = new THREE.Vector3(-3.5, -0.5, 0);
        let targetBossPos = new THREE.Vector3(3.5, -0.5, 0);
        // Per-map vertical "float" offset: lifts player/boss (and the camera's
        // framing) up off the platform without touching any of the attack.js
        // lunge/retreat positions (those only ever change X/Z). Set by
        // init3DArena() in map.js based on the current mapKey.
        let arenaFloatY = 0;
        let arenaCameraLiftY = 0;
        let arenaCameraZ = 9.5;
        let is3DInitialized = false;

        // Visual effects timing 
        let cameraShakeTime = 0;
        let hitLightFlash = 0;
        let hitLightColor = 0xffffff;

        function playSynthSound(type) {
            if (gameState.isSoundMuted) return;
            try {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                const now = audioCtx.currentTime;

                if (type === 'hit_boss') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                } else if (type === 'hit_player') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.linearRampToValueAtTime(50, now + 0.35);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.start(now);
                    osc.stop(now + 0.35);
                } else if (type === 'click') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.linearRampToValueAtTime(300, now + 0.06);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                    osc.start(now);
                    osc.stop(now + 0.06);
                } else if (type === 'victory') {
                    const melody = [300, 400, 500, 650, 800];
                    melody.forEach((freq, idx) => {
                        const nOsc = audioCtx.createOscillator();
                        const nGain = audioCtx.createGain();
                        nOsc.connect(nGain);
                        nGain.connect(audioCtx.destination);
                        nOsc.type = 'sine';
                        nOsc.frequency.setValueAtTime(freq, now + (idx * 0.08));
                        nGain.gain.setValueAtTime(0.1, now + (idx * 0.08));
                        nGain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.3);
                        nOsc.start(now + (idx * 0.08));
                        nOsc.stop(now + (idx * 0.08) + 0.3);
                    });
                } else if (type === 'defeat') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.linearRampToValueAtTime(55, now + 0.5);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                } else if (type === 'hint') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(750, now);
                    osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                } else if (type === 'charge') {
                    // Yuehan spell wind-up: rising sine sweep
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.5);
                    gain.gain.setValueAtTime(0.01, now);
                    gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                } else if (type === 'blast') {
                    // Yuehan spell release: low-to-high sawtooth whoosh
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(80, now);
                    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                } else if (type === 'impact') {
                    // Yuehan spell landing on the boss
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.linearRampToValueAtTime(80, now + 0.4);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                }
            } catch (e) {
                console.warn("Synthesizer failed:", e);
            }
        }

        function toggleSound() {
            gameState.isSoundMuted = !gameState.isSoundMuted;
            const soundIcon = document.getElementById("soundIcon");
            if (gameState.isSoundMuted) {
                soundIcon.className = "fa-solid fa-volume-xmark text-rose-500";
            } else {
                soundIcon.className = "fa-solid fa-volume-high";
                playSynthSound('click');
            }
        }

        function animate3D() {
            if (!is3DInitialized) return;
            requestAnimationFrame(animate3D);

            const time = Date.now() * 0.003;
            
            if (lavaUniforms) {
                lavaUniforms.uTime.value = time;
            }

            // Animate god rays slowly rotating
            if (godRay) godRay.rotation.y += 0.0015;
            if (godRayInner) godRayInner.rotation.y -= 0.0022;

            // Make the giant background serpent actually swim along the pillar arc:
            // the whole body flows back and forth along serpentPathPoint() (map.js),
            // with each segment replaying the head's position from slightly earlier
            // (follow-the-leader), so it reads as one continuous body slithering
            // between the pillars. It ping-pongs between the two ends of the arc
            // instead of wrapping, so it never needs to leave the safe back region.
            if (serpentSegments.length > 0 && typeof serpentPathPoint === "function") {
                const swimSpeed = 0.05;   // how fast the body flows along the arc
                const followDelay = 0.03; // time-lag between consecutive segments
                const headRaw = time * swimSpeed;

                // Smooth ease instead of a linear ping-pong: a linear triangle wave
                // reverses direction instantly at each end (velocity jumps from +v to
                // -v with no easing), which reads as the snake "snapping"/getting stuck
                // right at the turn. This cosine-based version has zero velocity right
                // at t=0 and t=1, so it glides to a stop and eases back the other way.
                const toT = (raw) => {
                    return (1 - Math.cos(raw * Math.PI)) / 2;
                };

                const points = serpentSegments.map((seg, i) => {
                    const p = serpentPathPoint(toT(headRaw - i * followDelay));
                    p.y += Math.sin(time * 0.6 + i * 0.3) * 0.25; // subtle extra bob
                    return p;
                });

                serpentSegments.forEach((seg, i) => {
                    seg.position.copy(points[i]);
                    if (i === 0) {
                        seg.lookAt(serpentPathPoint(toT(headRaw + followDelay)));
                    } else {
                        seg.lookAt(points[i - 1]);
                    }
                });
            }

            // The giant serpent now swims along a fixed arc behind the background
            // pillars (see above), so the whole group itself is intentionally never
            // rotated/orbited anymore -- doing so would eventually sweep it toward
            // the camera/platform.

            // --- Ice-God Arena background cast (map1 only) ---
            if (gameState.currentArenaMap === 'map1' && iceQilinGroup) {
                // Colossal Ice Qilin pacing back and forth behind the arena
                const walkSpeed = 1.5, walkAmp = 0.5, pacingRange = 10;
                iceQilinGroup.position.x = Math.sin(time * 0.3) * pacingRange;
                const nextX = Math.sin((time + 0.1) * 0.3) * pacingRange;
                const targetRotY = (nextX - iceQilinGroup.position.x >= 0) ? Math.PI / 2 : -Math.PI / 2;
                iceQilinGroup.rotation.y = THREE.MathUtils.lerp(iceQilinGroup.rotation.y, targetRotY, 0.05);
                iceQilinGroup.position.y = -3.5 + Math.abs(Math.sin(time * walkSpeed * 2)) * 0.2;

                iceQilinLegs.forEach((leg, i) => {
                    leg.rotation.x = Math.sin(time * walkSpeed + (i % 2 === 0 ? 0 : Math.PI)) * walkAmp;
                });
                if (iceQilinHead) iceQilinHead.rotation.y = Math.sin(time * 1.0) * 0.15;
                if (iceQilinSnout) iceQilinSnout.rotation.y = Math.sin(time * 1.0) * 0.15;
                if (iceQilinTailGroup) iceQilinTailGroup.rotation.z = Math.sin(time * 3.0) * 0.2;
                iceQilinTailSegments.forEach((seg, idx) => {
                    seg.rotation.y = Math.sin(time * 5 - idx * 0.5) * 0.3;
                });

                if (iceQilinAura) {
                    const qaPos = iceQilinAura.geometry.attributes.position.array;
                    for (let i = 0; i < iceQilinAuraCount; i++) {
                        qaPos[i * 3 + 1] += 0.04;
                        qaPos[i * 3 + 2] += 0.02;
                        if (qaPos[i * 3 + 1] > 8) {
                            qaPos[i * 3] = (Math.random() - 0.5) * 10;
                            qaPos[i * 3 + 1] = -4 + Math.random() * 2;
                            qaPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
                        }
                    }
                    iceQilinAura.geometry.attributes.position.needsUpdate = true;
                }

                // Snowstorm pillars spinning flanking the arena
                iceTornados.forEach(t => {
                    t.mesh.rotation.y -= t.speed;
                    t.mesh.rotation.x = Math.sin(time * 1.5) * 0.05;
                });

                // Overhead swirling snow vortex
                if (iceVortexPoints) {
                    const vPos = iceVortexPoints.geometry.attributes.position.array;
                    for (let i = 0; i < iceVortexCount; i++) {
                        const p = iceVortexParticles[i];
                        p.angle += p.speed * 0.015;
                        const waveRadius = p.dist + Math.sin(time * 2 + p.dist * 1.0) * 0.3;
                        vPos[i * 3] = Math.cos(p.angle) * waveRadius;
                        vPos[i * 3 + 1] = p.yOffset + Math.sin(time * 3 + p.dist) * 0.2;
                        vPos[i * 3 + 2] = Math.sin(p.angle) * waveRadius;
                    }
                    iceVortexPoints.geometry.attributes.position.needsUpdate = true;
                    iceVortexPoints.parent.rotation.y = time * 0.1;
                }

                // Aura particle ring hugging the frost dais + rotating glyph ring
                if (iceArenaAura) {
                    const aPos = iceArenaAura.geometry.attributes.position.array;
                    for (let i = 0; i < iceArenaAuraCount; i++) {
                        iceArenaAuraAngles[i] += 0.02;
                        const radius = 5 + Math.sin(time * 2 + i) * 0.5;
                        aPos[i * 3] = Math.cos(iceArenaAuraAngles[i]) * radius;
                        aPos[i * 3 + 2] = Math.sin(iceArenaAuraAngles[i]) * radius;
                    }
                    iceArenaAura.geometry.attributes.position.needsUpdate = true;
                }
                if (iceMagicRing) iceMagicRing.rotation.z += 0.01;

                // Falling snow across the whole arena
                if (iceSnowPoints) {
                    const sPos = iceSnowPoints.geometry.attributes.position.array;
                    for (let i = 0; i < iceSnowCount; i++) {
                        sPos[i * 3 + 1] -= iceSnowSpeeds[i];
                        sPos[i * 3] -= 0.1;
                        if (sPos[i * 3 + 1] < -5) {
                            sPos[i * 3 + 1] = 12;
                            sPos[i * 3] = (Math.random() - 0.5) * 40;
                        }
                    }
                    iceSnowPoints.geometry.attributes.position.needsUpdate = true;
                }
            }

            // --- Golden Dragon Thunder Arena background cast (map2 only) ---
            if (gameState.currentArenaMap === 'map2' && goldDragonGroup) {
                // Weaving snake-like flight path for the golden dragon, coiling
                // around the sacred pillars (values ported from the reference
                // scene divided by 10 to match this file's compact arena scale)
                const speed = 1.65, radiusBase = 15;
                const numSegments = goldDragonSegments.length;
                const dragonPath = [];
                for (let i = 0; i < numSegments; i++) {
                    const offset = i * 0.16;
                    const t = time * speed - offset;
                    const angle = t * 0.55;
                    const weave = Math.sin(angle * 7) * 5;
                    const px = Math.cos(angle) * (radiusBase + weave);
                    const pz = Math.sin(angle) * (radiusBase + weave * 0.5) - 16;
                    const py = 2 + Math.sin(t * 1.6) * 2.6 + Math.cos(angle * 2) * 0.8;
                    dragonPath[i] = new THREE.Vector3(px, py, pz);
                }
                for (let i = 0; i < numSegments; i++) {
                    const segment = goldDragonSegments[i];
                    segment.position.copy(dragonPath[i]);
                    if (i > 0) {
                        segment.lookAt(dragonPath[i - 1]);
                    } else {
                        const futureT = time * speed + 0.16;
                        const fAngle = futureT * 0.55;
                        const fWeave = Math.sin(fAngle * 7) * 5;
                        const fpx = Math.cos(fAngle) * (radiusBase + fWeave);
                        const fpz = Math.sin(fAngle) * (radiusBase + fWeave * 0.5) - 16;
                        const fpy = 2 + Math.sin(futureT * 1.6) * 2.6 + Math.cos(fAngle * 2) * 0.8;
                        segment.lookAt(new THREE.Vector3(fpx, fpy, fpz));
                    }
                }

                // Golden helix aura spinning around each sacred pillar
                goldPillars.forEach((p, index) => {
                    if (p.spiral) p.spiral.rotation.y = time * 2.5 + index;
                });

                // Lightning pool energy-wave ripple
                if (goldPoolEnergy) {
                    const poolPositions = goldPoolEnergy.geometry.attributes.position;
                    for (let i = 0; i < poolPositions.count; i++) {
                        const vx = poolPositions.getX(i);
                        const vy = poolPositions.getY(i);
                        const z = Math.sin(vx * 1.6 + time * 3.5) * 0.22 + Math.cos(vy * 1.6 + time * 2.5) * 0.22;
                        poolPositions.setZ(i, z);
                    }
                    goldPoolEnergy.geometry.attributes.position.needsUpdate = true;
                }

                // Random upward lightning bolts from the pool to the clouds
                if (Math.random() < 0.1 && typeof spawnGoldLightningBolt === "function") {
                    spawnGoldLightningBolt();
                }
                for (let i = goldLightningBolts.length - 1; i >= 0; i--) {
                    const bolt = goldLightningBolts[i];
                    bolt.life -= bolt.decay;
                    if (bolt.life <= 0) {
                        scene.remove(bolt.line);
                        scene.remove(bolt.light);
                        bolt.line.geometry.dispose();
                        bolt.line.material.dispose();
                        goldLightningBolts.splice(i, 1);
                    } else {
                        bolt.line.material.opacity = bolt.life;
                        bolt.light.intensity = bolt.life * 8;
                    }
                }
                if (goldSkyFlashLight && goldSkyFlashLight.intensity > 0) goldSkyFlashLight.intensity *= 0.86;

                // Reverse-gravity gold sparks rising from the pool toward the clouds
                if (goldSparkPoints) {
                    const gPos = goldSparkPoints.geometry.attributes.position.array;
                    for (let i = 0; i < goldSparkCount; i++) {
                        gPos[i * 3 + 1] += 0.042 + Math.random() * 0.04;
                        gPos[i * 3] += Math.sin(time * 2.5 + i) * 0.012;
                        if (gPos[i * 3 + 1] > 5.5) {
                            gPos[i * 3 + 1] = -1.8;
                        }
                    }
                    goldSparkPoints.geometry.attributes.position.needsUpdate = true;
                }
            }

            // Animate rising frost embers
            if (backgroundSparks) {
                const positions = backgroundSparks.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] += 0.012; // slow rising speed
                    if (positions[i] > 13) {
                        positions[i] = -2; // Reset particle position back to stage floor
                    }
                }
                backgroundSparks.geometry.attributes.position.needsUpdate = true;
            }

            // Slow floating idle breathing effect (arenaFloatY lifts them off the
            // platform on maps like the Ice-God Arena where they should float)
            playerGroup.position.y = targetPlayerPos.y + arenaFloatY + Math.sin(time) * 0.15;
            bossGroup.position.y = targetBossPos.y + arenaFloatY + Math.cos(time) * 0.15;

            // Breathe rotation
            playerGroup.rotation.y = Math.sin(time * 2) * 0.08;
            bossGroup.rotation.y = Math.sin(time) * 0.05;

            // Animate hovering obsidian fists
            const bossFistL = bossGroup.getObjectByName("boss_fist_L");
            const bossFistR = bossGroup.getObjectByName("boss_fist_R");
            if (bossFistL) bossFistL.position.y = 0.3 + Math.sin(time * 3) * 0.05;
            if (bossFistR) bossFistR.position.y = 0.3 + Math.cos(time * 3) * 0.05;

            // Pulsing void aura around the boss
            const bossAura = bossGroup.getObjectByName("bossAura");
            if (bossAura) {
                bossAura.rotation.x = time;
                bossAura.rotation.y = time * 1.2;
                bossAura.scale.setScalar(1.0 + Math.cos(time * 2.5) * 0.05);
            }

            // Spinning morning-star flail wheel behind the boss
            const bossFlailWheel = bossGroup.getObjectByName("sword_wheel");
            if (bossFlailWheel) {
                bossFlailWheel.rotation.z = time * 0.6;
                bossFlailWheel.position.z = -0.3 + Math.sin(time * 2) * 0.05;
            }

            // Rotational cycles for halos and runic rings
            const halo = playerGroup.getObjectByName("halo");
            if (halo) {
                halo.rotation.z += 0.035;
            }

            // Yuehan: spinning back wheel animation
            const backWheel = playerGroup.getObjectByName("spinning_back_wheel");
            if (backWheel) { backWheel.rotation.z += 0.018; }

            // Yuehan: ice mage shader time update
            if (typeof iceMageUniforms !== 'undefined') { iceMageUniforms.uTime.value = time; }

            // เหลย เจิ้น (character3): raijin lightning spear/halo shader time update
            if (typeof raijinSpearUniforms !== 'undefined') { raijinSpearUniforms.uTime.value = time; }

            // เหลย เจิ้น (character3): golden lightning trail sparks continuously rising/orbiting
            // around the player -- this is the "raining golden light" look from the reference art.
            if (gameState.user.selectedCharacter === 'character3') {
                if (Math.random() < 0.75 && divineSparks.length < 90) {
                    const geo = new THREE.BoxGeometry(0.04, 0.25, 0.04);
                    const mat = new THREE.MeshBasicMaterial({
                        color: Math.random() > 0.4 ? 0xfacc15 : 0xfef08a,
                        transparent: true,
                        opacity: 0.85,
                        blending: THREE.AdditiveBlending
                    });
                    const m = new THREE.Mesh(geo, mat);

                    const theta = Math.random() * Math.PI * 2;
                    const rad = 0.2 + Math.random() * 0.6;
                    m.position.copy(playerGroup.position);
                    m.position.x += Math.cos(theta) * rad;
                    m.position.y += Math.random() * 1.4 - 0.2;
                    m.position.z += Math.sin(theta) * rad;

                    scene.add(m);
                    divineSparks.push({
                        mesh: m,
                        birth: Date.now(),
                        thetaSpeed: 0.08 + Math.random() * 0.06,
                        currentTheta: theta,
                        yVel: 0.02 + Math.random() * 0.03
                    });
                }

                for (let i = divineSparks.length - 1; i >= 0; i--) {
                    const p = divineSparks[i];
                    p.currentTheta += p.thetaSpeed;
                    p.mesh.position.x = playerGroup.position.x + Math.cos(p.currentTheta) * 0.6;
                    p.mesh.position.z = playerGroup.position.z + Math.sin(p.currentTheta) * 0.6;
                    p.mesh.position.y += p.yVel;
                    p.mesh.scale.multiplyScalar(0.96);

                    if (Date.now() - p.birth > 1000) {
                        scene.remove(p.mesh);
                        divineSparks.splice(i, 1);
                    }
                }
            } else if (divineSparks.length > 0) {
                // Clean up leftover sparks if the player switches away from character3 mid-session
                divineSparks.forEach(p => scene.remove(p.mesh));
                divineSparks.length = 0;
            }

            // Yuehan: orbiting ice shard clusters
            if (typeof heroIceMistClusters !== 'undefined' && heroIceMistClusters.length > 0) {
                heroIceMistClusters.forEach((shard, i) => {
                    const angle = time * 1.2 + (i / heroIceMistClusters.length) * Math.PI * 2;
                    shard.position.set(
                        playerGroup.position.x + Math.cos(angle) * 0.65,
                        playerGroup.position.y + 0.5 + Math.sin(time * 2 + i) * 0.1,
                        playerGroup.position.z + Math.sin(angle) * 0.4
                    );
                    shard.rotation.y += 0.05;
                });
            }

            // Smoothly move meshes towards target transitions (Dash animation)
            playerGroup.position.x += (targetPlayerPos.x - playerGroup.position.x) * 0.15;
            bossGroup.position.x += (targetBossPos.x - bossGroup.position.x) * 0.15;

            // Dynamic camera shake calculation
            let shakeOffset = new THREE.Vector3(0, 0, 0);
            if (cameraShakeTime > 0) {
                cameraShakeTime -= 0.016;
                shakeOffset.set(
                    (Math.random() - 0.5) * 0.35,
                    (Math.random() - 0.5) * 0.35,
                    (Math.random() - 0.5) * 0.35
                );
            }

            // Reaction flash lighting dampening
            if (hitLightFlash > 0) {
                hitLightFlash -= 0.04;
                pointLight.color.setHex(hitLightColor);
                pointLight.intensity = 1.0 + hitLightFlash * 4.0;
            } else {
                pointLight.color.setHex(0xf43f5e);
                pointLight.intensity = 1.2;
            }

            // Rotate camera slightly based on mouse position
            camera.position.x += ((mouseX * 4) + shakeOffset.x - camera.position.x) * 0.05;
            camera.position.y += (((mouseY * 2) + 1.8 + arenaCameraLiftY) + shakeOffset.y - camera.position.y) * 0.05;
            camera.position.z += (arenaCameraZ + shakeOffset.z - camera.position.z) * 0.05;
            camera.lookAt(0, 0.5 + arenaCameraLiftY, 0);

            // Update 3D damage particles
            for (let i = damageParticles.length - 1; i >= 0; i--) {
                const p = damageParticles[i];
                p.mesh.position.add(p.velocity);
                p.velocity.y -= 0.005; // gravity
                p.age += 1;
                p.mesh.scale.multiplyScalar(0.95);
                if (p.age > 40) {
                    scene.remove(p.mesh);
                    damageParticles.splice(i, 1);
                }
            }

            // Update Yuehan's spell projectiles (stone rain / chakram storm)
            for (let i = activeProjectiles.length - 1; i >= 0; i--) {
                const proj = activeProjectiles[i];
                proj.progress += proj.speed;

                if (proj.isParabolic) {
                    const currentPos = new THREE.Vector3().lerpVectors(proj.startPos, proj.targetPos, proj.progress);
                    currentPos.y += Math.sin(proj.progress * Math.PI) * 1.8;
                    proj.group.position.copy(currentPos);
                } else {
                    proj.group.position.lerpVectors(proj.startPos, proj.targetPos, proj.progress);
                }

                proj.group.rotation.x += 0.35;
                proj.group.rotation.y += 0.25;

                proj.satellites.forEach((sat, satIdx) => {
                    const orbit = time * 10 + satIdx;
                    sat.position.set(Math.cos(orbit) * 0.32, Math.sin(orbit) * 0.32, (Math.random() - 0.5) * 0.1);
                });

                if (proj.progress >= 1.0) {
                    // Impact — purely cosmetic, damage was already applied on answer submit
                    playSynthSound('impact');
                    cameraShakeTime = 0.4;
                    hitLightFlash = 1.0;
                    hitLightColor = 0x00f3ff;
                    spawn3DParticles(proj.group.position, 20, 0x00f3ff);
                    spawn3DParticles(proj.group.position, 10, 0xffffff);

                    bossGroup.rotation.z = -0.5;
                    setTimeout(() => { bossGroup.rotation.z = 0; }, 200);

                    scene.remove(proj.group);
                    activeProjectiles.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        }

        window.addEventListener("resize", () => {
            if (renderer && camera && threeDContainer) {
                const w = threeDContainer.clientWidth;
                const h = threeDContainer.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }
        });

        // ============================================================
        //  CONFIG: วาง Web App URL จาก Google Apps Script ด้านล่างนี้
        //  วิธี Deploy:
        //    1. Google Sheets > Extensions > Apps Script
        //    2. วางโค้ดจากไฟล์ google_apps_script.js ลงไป
        //    3. Deploy > New deployment > Web app
        //       - Execute as: Me  /  Who has access: Anyone
        //    4. คัดลอก Web app URL แล้วแทนที่ YOUR_DEPLOYMENT_URL_HERE
        //  ⚠️ หมายเหตุความปลอดภัย: URL นี้ฝังอยู่ใน client-side ใครก็ตามที่เปิด
        //     DevTools จะเห็นและยิง request ปลอมเข้าชีตได้ ถ้าต้องการป้องกัน
        //     ควรเช็ค secret token ฝั่ง Apps Script เพิ่มเติม
        // ============================================================
        const SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbybrUAElTuFtFuJkz-rxJkj60rUvOZ1mrF9-IPJRv4ZxSDnzPTDzJ85oLRRoTiNukqw_w/exec";

        // ============================================================
        //  CONFIG: Backend API (Express + MongoDB) ที่รันอยู่ที่ localhost:4000
        //  ⚠️ ตอน deploy ขึ้นเซิร์ฟเวอร์จริง ให้เปลี่ยนเป็น URL ของ backend จริง
        //     (เช่น https://your-backend-domain.com/api)
        // ============================================================
        const API_BASE_URL = "http://localhost:4000/api";
        const TOKEN_STORAGE_KEY = "koquizz_token";

        // Session ID แยกต่อคน (ใช้ random + timestamp เพื่อไม่ซ้ำกัน)
        const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        async function sendToSheets(action = "login", password = "") {
            if (SHEETS_ENDPOINT.includes("YOUR_DEPLOYMENT_URL_HERE")) {
                console.log("[Sheets] ยังไม่ได้ตั้งค่า SHEETS_ENDPOINT — ข้ามการบันทึก");
                return;
            }
            try {
                const payload = {
                    timestamp:      new Date().toISOString(),
                    session_id:     SESSION_ID,
                    name:           gameState.user.name,
                    title:          gameState.user.title,
                    password:       password || "",
                    action:         action,
                    character:      gameState.user.selectedCharacter,
                    xp:             gameState.user.xp,
                    level:          gameState.user.level,
                    cleared_stages: gameState.user.clearedSubStages.length
                };
                await fetch(SHEETS_ENDPOINT, {
                    method:  "POST",
                    mode:    "no-cors",   // Google Apps Script ไม่รองรับ CORS แบบปกติ
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload)
                });
                console.log(`[Sheets] บันทึก action="${action}" ชื่อ="${gameState.user.name}" สำเร็จ`);
            } catch (err) {
                console.warn("[Sheets] ส่งข้อมูลไม่สำเร็จ:", err.message);
            }
        }

        // ============================================================
        //  ACCOUNT SYSTEM (username + password)
        //  ⚠️ หมายเหตุความปลอดภัย: เกมนี้เป็นหน้าเว็บฝั่ง client ล้วนๆ ไม่มีเซิร์ฟเวอร์
        //     บัญชีทั้งหมดถูกเก็บไว้ใน localStorage ของเบราว์เซอร์เครื่องนั้นๆ เท่านั้น
        //     (ไม่ได้ sync ข้ามเครื่อง/เบราว์เซอร์) รหัสผ่านจะไม่ถูกเก็บเป็น plain text
        //     แต่ถูกแฮชด้วย SHA-256 ก่อนบันทึกเสมอ — เหมาะสำหรับเกมเพื่อการเรียนรู้
        //     ไม่ใช่ระบบยืนยันตัวตนระดับใช้งานจริง/ธุรกิจ
        // ============================================================
        const ACCOUNTS_STORAGE_KEY = "koquizz_accounts_v1";
        let currentAuthTab = "login";

        function normalizeUsernameKey(username) {
            return username.trim().toLowerCase().replace(/\s+/g, "_");
        }

        function loadAccounts() {
            try {
                return JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY)) || {};
            } catch (e) {
                return {};
            }
        }

        function saveAccounts(accounts) {
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        }

        async function hashPassword(password) {
            try {
                const data = new TextEncoder().encode(password);
                const digest = await crypto.subtle.digest("SHA-256", data);
                return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
            } catch (e) {
                // Fallback (เบราว์เซอร์เก่ามาก / เปิดผ่าน http ที่ไม่ใช่ localhost อาจไม่มี crypto.subtle)
                let hash = 0;
                for (let i = 0; i < password.length; i++) {
                    hash = (hash * 31 + password.charCodeAt(i)) >>> 0;
                }
                return "fallback_" + hash.toString(16);
            }
        }

        function switchAuthTab(tab) {
            currentAuthTab = tab;
            clearAuthError();
            playSynthSound('click');

            const tabLoginBtn = document.getElementById("tabLoginBtn");
            const tabRegisterBtn = document.getElementById("tabRegisterBtn");
            const loginForm = document.getElementById("loginForm");
            const registerForm = document.getElementById("registerForm");
            const authTitle = document.getElementById("authScreenTitle");

            const activeClasses = ["bg-gradient-to-r", "from-cyan-500", "to-indigo-500", "text-white", "shadow"];

            if (tab === "login") {
                loginForm.classList.remove("hidden");
                registerForm.classList.add("hidden");
                tabLoginBtn.classList.add(...activeClasses);
                tabLoginBtn.classList.remove("text-slate-400");
                tabRegisterBtn.classList.remove(...activeClasses);
                tabRegisterBtn.classList.add("text-slate-400");
                authTitle.textContent = "เข้าสู่ระบบนักรบ 3D";
            } else {
                registerForm.classList.remove("hidden");
                loginForm.classList.add("hidden");
                tabRegisterBtn.classList.add(...activeClasses);
                tabRegisterBtn.classList.remove("text-slate-400");
                tabLoginBtn.classList.remove(...activeClasses);
                tabLoginBtn.classList.add("text-slate-400");
                authTitle.textContent = "ลงทะเบียนนักรบ 3D";
            }
        }

        function showAuthError(message) {
            const box = document.getElementById("authErrorBox");
            const text = document.getElementById("authErrorText");
            text.textContent = message;
            box.classList.remove("hidden");
            box.classList.add("flex");
        }

        function clearAuthError() {
            const box = document.getElementById("authErrorBox");
            box.classList.add("hidden");
            box.classList.remove("flex");
        }

        async function handleLoginSubmit(event) {
            event.preventDefault();
            clearAuthError();

            const username = document.getElementById("loginUsernameInput").value.trim();
            const password = document.getElementById("loginPasswordInput").value;

            if (!username || !password) return;

            playSynthSound('click');

            try {
                const res = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (!res.ok) {
                    showAuthError(data.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
                    return;
                }

                localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
                finalizeLogin(data.user, false);
            } catch (err) {
                showAuthError("ไม่สามารถเชื่อมต่อกับ server ได้ กรุณาตรวจสอบว่า server กำลังทำงานอยู่ (npm run dev)");
            }
        }

        async function handleRegisterSubmit(event) {
            event.preventDefault();
            clearAuthError();

            const username = document.getElementById("registerUsernameInput").value.trim();
            const password = document.getElementById("registerPasswordInput").value;
            const passwordConfirm = document.getElementById("registerPasswordConfirmInput").value;
            // เลือกแมพถูกย้ายไปอยู่ในหน้าเลือกฮีโร่แล้ว — ตอนสมัครสมาชิกใช้ค่าเริ่มต้น map1 ไปก่อน
            const title = "❄️ ทะเลทรายน้ำแข็งอาถรรพ์";
            const selectedMap = "map1";

            if (!username || !password) return;

            if (password.length < 6) {
                showAuthError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
                return;
            }
            if (password !== passwordConfirm) {
                showAuthError("รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณากรอกใหม่");
                return;
            }

            playSynthSound('click');

            try {
                const res = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, displayName: username })
                });
                const data = await res.json();

                if (!res.ok) {
                    showAuthError(data.error || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่");
                    return;
                }

                localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

                // ตั้งค่าเริ่มต้นเฉพาะตอนสมัครสมาชิกใหม่ (title + แผนที่เริ่มต้น) แล้วซิงก์กลับไปที่ server
                data.user.title = title;
                data.user.selectedMap = selectedMap;

                finalizeLogin(data.user, true);
                persistCurrentUserProgress();
            } catch (err) {
                showAuthError("ไม่สามารถเชื่อมต่อกับ server ได้ กรุณาตรวจสอบว่า server กำลังทำงานอยู่ (npm run dev)");
            }
        }

        // ใช้ร่วมกันทั้งตอน login และ register สำเร็จ เพื่อเข้าสู่หน้าเลือกฮีโร่
        // user คือ object ที่ backend ส่งกลับมา (มี id, username, displayName, title, xp, level, clearedSubStages, selectedMap, selectedCharacter)
        function finalizeLogin(user, isNewAccount = false) {
            gameState.user.name = user.displayName;
            gameState.user.username = user.username || "";
            gameState.user.title = user.title || "นักกุนซือเรียนรู้";
            gameState.user.selectedMap = user.selectedMap || "map1";
            gameState.user.selectedCharacter = user.selectedCharacter || gameState.user.selectedCharacter;
            gameState.user.xp = user.xp || 0;
            gameState.user.level = user.level || 1;
            gameState.user.clearedSubStages = user.clearedSubStages || [];
            gameState.user.accountKey = user.id; // เก็บ Mongo _id ไว้อ้างอิง (ใช้เช็คว่า login อยู่ไหม)
            gameState.userStorageKey = user.id; // เผื่อโค้ดส่วนอื่นยังอ้างอิงชื่อนี้อยู่

            renderCharacterRoster();

            document.getElementById("loginForm").reset();
            document.getElementById("registerForm").reset();
            clearAuthError();

            document.getElementById("screenLogin").classList.add("hidden");
            document.getElementById("screenCharSelect").classList.remove("hidden");

            document.getElementById("playerBadge").classList.remove("hidden");
            document.getElementById("backToFirstPageBtn").classList.remove("hidden");
            document.getElementById("headerName").textContent = user.displayName;

            const initialAvatar = document.getElementById("headerAvatarContainer");
            initialAvatar.textContent = user.displayName.substring(0, 2).toUpperCase();

            updateHeaderXp();

            const actionLabel = isNewAccount ? "register" : "login";
            const welcomeMsg = isNewAccount
                ? `✅ สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${user.displayName}!`
                : `✅ ยินดีต้อนรับกลับมา ${user.displayName}!`;

            // การบันทึกลง Google Sheets เป็นแค่สถิติเสริม ไม่ใช่ระบบบัญชีหลักแล้ว (ไม่ส่งรหัสผ่านไปด้วย)
            sendToSheets(actionLabel).then(() => {
                showLoginToast(welcomeMsg);
            }).catch(() => {
                showLoginToast(welcomeMsg);
            });
        }

        // บันทึกความคืบหน้าปัจจุบัน (XP, level, ด่านที่ผ่านแล้ว, แผนที่/ตัวละครที่เลือก) ไปที่ backend/MongoDB
        // เรียกแบบ fire-and-forget (ไม่ await ตอนเรียกใช้) เพื่อไม่ให้เกมหน่วงรอ network
        async function persistCurrentUserProgress() {
            const token = localStorage.getItem(TOKEN_STORAGE_KEY);
            if (!token) return; // ยังไม่ได้ login ก็ข้ามไป

            try {
                const res = await fetch(`${API_BASE_URL}/users/me`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        xp: gameState.user.xp,
                        level: gameState.user.level,
                        clearedSubStages: gameState.user.clearedSubStages,
                        selectedMap: gameState.user.selectedMap,
                        selectedCharacter: gameState.user.selectedCharacter,
                        title: gameState.user.title
                    })
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    console.warn("[Progress] server ปฏิเสธการบันทึก:", data.error || res.status);
                }
            } catch (err) {
                console.warn("[Progress] บันทึกความคืบหน้าไปยัง server ไม่สำเร็จ (อาจไม่ได้เชื่อมต่อ):", err.message);
            }
        }

        function showLoginToast(message) {
            const toast = document.getElementById("toastLoginSuccess");
            const toastText = document.getElementById("toastLoginText");
            if (!toast || !toastText) return;
            toastText.textContent = message;
            toast.classList.remove("hidden");
            setTimeout(() => {
                toast.classList.add("hidden");
            }, 3500);
        }

        function goToLandingPage() {
            playSynthSound('click');
            // Hide all gameplay panels
            document.getElementById("screenLanding").classList.remove("hidden");
            document.getElementById("screenLogin").classList.add("hidden");
            document.getElementById("screenCharSelect").classList.add("hidden");
            document.getElementById("screenCategorySelect").classList.add("hidden");
            document.getElementById("screenDashboard").classList.add("hidden");
            document.getElementById("screenSubStageSelect").classList.add("hidden");
            document.getElementById("screenBattle").classList.add("hidden");
            
            // Popups
            document.getElementById("modalSurrender").classList.add("hidden");
            document.getElementById("modalDefeat").classList.add("hidden");
            document.getElementById("modalVictory").classList.add("hidden");
            
            // Badge & Back to Home button (hidden in main landing)
            document.getElementById("playerBadge").classList.add("hidden");
            document.getElementById("backToFirstPageBtn").classList.add("hidden");
        }

        function goToLoginScreen() {
            playSynthSound('click');
            // Hide Landing
            document.getElementById("screenLanding").classList.add("hidden");
            
            // Show Login (เริ่มที่แท็บ "เข้าสู่ระบบ" เสมอ พร้อมล้างข้อความผิดพลาดเก่า)
            document.getElementById("screenLogin").classList.remove("hidden");
            switchAuthTab('login');
            document.getElementById("loginForm").reset();
            document.getElementById("registerForm").reset();
            document.getElementById("screenCharSelect").classList.add("hidden");
            document.getElementById("screenCategorySelect").classList.add("hidden");
            document.getElementById("screenDashboard").classList.add("hidden");
            document.getElementById("screenSubStageSelect").classList.add("hidden");
            document.getElementById("screenBattle").classList.add("hidden");
            
            document.getElementById("playerBadge").classList.add("hidden");
            document.getElementById("backToFirstPageBtn").classList.remove("hidden");
        }


        function showResetConfirmation() {
            playSynthSound('click');
            document.getElementById("modalResetConfirm").classList.remove("hidden");
        }

        function closeResetConfirmation() {
            playSynthSound('click');
            document.getElementById("modalResetConfirm").classList.add("hidden");
        }

        function executeResetProgress() {
            playSynthSound('defeat');
            gameState.user.clearedSubStages = [];
            gameState.user.xp = 0;
            gameState.user.level = 1;
            persistCurrentUserProgress();
            
            closeResetConfirmation();
            renderCategoryList();
            updateHeaderXp();
        }


        function prepareQuestions(catId, subId) {
            const category = STAGES_DATA[catId];
            const sub = category.subStages.find(s => s.id === subId);
            const originalQuestions = sub.questions || [];

            const stageKey = `${catId}-${subId}`;
            if (!gameState.usedQuestions[stageKey]) {
                gameState.usedQuestions[stageKey] = [];
            }

            // Clean up duplicates
            let available = originalQuestions.filter(q => !gameState.usedQuestions[stageKey].includes(q.id));

            if (available.length === 0) {
                gameState.usedQuestions[stageKey] = [];
                available = [...originalQuestions];
            }

            gameState.currentQuestionPool = shuffleArray(available);
            gameState.currentQuestionIndex = 0;
        }

        // Fisher–Yates shuffle — unlike `array.sort(() => Math.random() - 0.5)`,
        // this gives every ordering an equal probability instead of a biased one.
        function shuffleArray(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function renderQuestion() {
            if (gameState.currentQuestionIndex >= gameState.currentQuestionPool.length) {
                prepareQuestions(gameState.selectedCategoryId, gameState.currentSubStageIndex);
            }

            const currentQ = gameState.currentQuestionPool[gameState.currentQuestionIndex];

            document.getElementById("quizIndexIndicator").textContent = `QUESTION ${String(gameState.currentQuestionIndex + 1).padStart(2, '0')}`;
            document.getElementById("quizQuestionText").textContent = currentQ.q;

            const choicesContainer = document.getElementById("quizChoicesContainer");
            choicesContainer.innerHTML = "";

            currentQ.choices.forEach((choice, idx) => {
                const choiceBtn = document.createElement("button");
                choiceBtn.onclick = () => submitAnswer(idx);
                choiceBtn.className = "choice-btn w-full text-left bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 p-4 rounded-2xl text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] flex items-start space-x-3.5 shadow-lg";
                
                const prefix = String.fromCharCode(65 + idx); 
                choiceBtn.innerHTML = `
                    <span class="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-extrabold text-[10px] shrink-0">${prefix}</span>
                    <span class="leading-relaxed choice-text">${choice}</span>
                `;
                choicesContainer.appendChild(choiceBtn);
            });

            // ตัวละคร "ริน" ถูกถอดออกชั่วคราว (รอโค้ดตัวละครที่ 2/3 ใหม่)
            // ถ้าตัวละครในอนาคตมีเพิร์คแบบ "ใช้คำใบ้ตัดชอยส์" ให้ผูกเงื่อนไขไว้ตรงนี้ เช่น:
            //   if (gameState.user.selectedCharacter === 'character2' && gameState.hintCount < 1) { ... }
        }


        async function submitAnswer(selectedIndex) {
            const currentQ = gameState.currentQuestionPool[gameState.currentQuestionIndex];

            // ปิดปุ่มทันทีกันกดซ้ำระหว่างรอผลจาก server
            const buttons = document.querySelectorAll("#quizChoicesContainer button");
            buttons.forEach(b => {
                b.disabled = true;
                b.style.pointerEvents = "none";
            });

            // เช็คคำตอบผ่าน server แทนการเทียบ currentQ.answer ในเครื่อง
            // (ฝั่งเว็บไม่มีเฉลยอยู่ในมือแล้ว กันคนเปิด DevTools โกงคำตอบ)
            let isCorrect = false;
            let correctAnswer = null;
            try {
                const res = await fetch(
                    `${API_BASE_URL}/stages/${gameState.selectedCategoryId}/substages/${gameState.currentSubStageIndex}/verify`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ questionId: currentQ.id, selected: selectedIndex }),
                    }
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "เช็คคำตอบไม่สำเร็จ");
                isCorrect = data.correct;
                correctAnswer = data.correctAnswer;
            } catch (err) {
                console.error("[Quiz] verify error:", err.message);
                // เน็ตหลุด/server ล่ม — กันเกมค้าง โดยถือว่าตอบผิดไปก่อน แล้วแจ้งผู้เล่น
                isCorrect = false;
                alert("เชื่อมต่อ server เพื่อเช็คคำตอบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต/backend");
            }

            // Track answer for victory score summary
            gameState.battleAnswerLog.push({
                q: currentQ.q,
                choices: currentQ.choices,
                answer: correctAnswer,
                selected: selectedIndex,
                isCorrect: isCorrect
            });

            const stageKey = `${gameState.selectedCategoryId}-${gameState.currentSubStageIndex}`;
            if (!gameState.usedQuestions[stageKey].includes(currentQ.id)) {
                gameState.usedQuestions[stageKey].push(currentQ.id);
            }

            buttons.forEach((b, idx) => {
                if (idx === correctAnswer) {
                    b.classList.remove("border-white/5", "bg-slate-950/60");
                    b.classList.add("border-emerald-500", "bg-emerald-950/10", "text-emerald-300");
                } else if (idx === selectedIndex && !isCorrect) {
                    b.classList.remove("border-white/5", "bg-slate-950/60");
                    b.classList.add("border-rose-500", "bg-rose-950/10", "text-rose-300");
                }
            });

            if (isCorrect) {
                let xpGain = 10;
                // ตัวละคร "เคนจิ" ถูกถอดออกชั่วคราว (รอโค้ดตัวละครที่ 2/3 ใหม่)
                // ถ้าตัวละครในอนาคตมีเพิร์คโบนัส XP ให้ผูกเงื่อนไขไว้ตรงนี้ เช่น:
                //   if (gameState.user.selectedCharacter === 'character2') { xpGain = 15; }
                gameState.user.xp += xpGain;
                updateHeaderXp();
                
                // Attack: Deducts 10 HP to allow exactly 10 rounds of play!
                executePlayerAttack(xpGain);
            } else {
                // Defend: Counterattacks and players take 10 HP damage!
                executeEnemyCounter();
            }

            setTimeout(() => {
                if (gameState.bossHp <= 0) {
                    triggerVictory();
                } else if (gameState.playerHp <= 0) {
                    if (gameState.isResurrectionAvailable) {
                        triggerResurrection();
                    } else {
                        triggerDefeat();
                    }
                } else {
                    gameState.currentQuestionIndex++;
                    renderQuestion();
                }
            }, 1800);
        }


        function triggerVictory() {
            playSynthSound('victory');
            
            const catId = gameState.selectedCategoryId;
            const subId = gameState.currentSubStageIndex;
            const subKey = `${catId}-${subId}`;

            // เก็บจำนวนด่านที่ผ่านแล้ว "ก่อน" เพิ่มด่านล่าสุด ไว้เทียบว่ามีฮีโร่ตัวใหม่ปลดล็อกหรือไม่
            const clearedCountBefore = gameState.user.clearedSubStages.length;

            if (!gameState.user.clearedSubStages.includes(subKey)) {
                gameState.user.clearedSubStages.push(subKey);
            }

            const clearedCountAfter = gameState.user.clearedSubStages.length;

            // แจ้งเตือนถ้าด่านที่เพิ่งผ่านทำให้มีฮีโร่ตัวใหม่ปลดล็อก
            checkCharacterUnlocks(clearedCountBefore, clearedCountAfter);

            const completionXp = 40;
            gameState.user.xp += completionXp;
            updateHeaderXp();
            persistCurrentUserProgress();

            const sub = STAGES_DATA[catId].subStages.find(s => s.id === subId);
            document.getElementById("victorySubStageName").textContent = sub.name;
            document.getElementById("victoryBossName").textContent = sub.bossName;
            document.getElementById("victoryXpText").textContent = `+${completionXp} XP (โบนัสชัยชนะ)`;

            document.getElementById("modalVictory").classList.remove("hidden");

            // Populate score summary
            const log = gameState.battleAnswerLog;
            const correctCount = log.filter(a => a.isCorrect).length;
            const wrongCount = log.length - correctCount;
            const accuracy = log.length > 0 ? Math.round((correctCount / log.length) * 100) : 0;

            document.getElementById("victoryCorrectCount").textContent = correctCount;
            document.getElementById("victoryWrongCount").textContent = wrongCount;
            document.getElementById("victoryAccuracyText").textContent = accuracy + "%";
            
            const accBar = document.getElementById("victoryAccuracyBar");
            accBar.style.width = accuracy + "%";
            if (accuracy >= 80) {
                accBar.className = "h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-cyan-400";
            } else if (accuracy >= 50) {
                accBar.className = "h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-500 to-yellow-400";
            } else {
                accBar.className = "h-full rounded-full transition-all duration-700 bg-gradient-to-r from-rose-500 to-pink-500";
            }

            // Build question review list
            const reviewContainer = document.getElementById("victoryQuestionReview");
            reviewContainer.innerHTML = "";
            log.forEach((entry, idx) => {
                const correctLabel = entry.choices[entry.answer];
                const selectedLabel = entry.choices[entry.selected];
                const isCorrect = entry.isCorrect;
                const row = document.createElement("div");
                row.className = "px-4 py-3 " + (isCorrect ? "" : "bg-rose-950/10");
                row.innerHTML = `
                    <div class="flex items-start space-x-2 mb-1">
                        <span class="text-[10px] font-extrabold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">${isCorrect ? '✅' : '❌'}</span>
                        <span class="text-[10px] text-slate-300 leading-relaxed font-semibold">${idx + 1}. ${entry.q}</span>
                    </div>
                    ${!isCorrect ? `<div class="ml-5 text-[9px] space-y-0.5">
                        <div><span class="text-slate-500">คุณเลือก:</span> <span class="text-rose-400 font-bold">${selectedLabel}</span></div>
                        <div><span class="text-slate-500">เฉลย:</span> <span class="text-emerald-400 font-bold">${correctLabel}</span></div>
                    </div>` : ""}
                `;
                reviewContainer.appendChild(row);
            });

            // ส่งข้อมูล victory ไป Google Sheets
            sendToSheets("victory");
        }

        function triggerDefeat() {
            playSynthSound('defeat');
            document.getElementById("modalDefeat").classList.remove("hidden");
        }

        function handleSurrender() {
            playSynthSound('defeat');
            document.getElementById("modalSurrender").classList.remove("hidden");
        }

        function retryCurrentStage() {
            document.getElementById("modalSurrender").classList.add("hidden");
            document.getElementById("modalDefeat").classList.add("hidden");
            document.getElementById("modalVictory").classList.add("hidden");

            startBattle(gameState.currentSubStageIndex);
        }

        window.onload = function() {
            console.log("K.O.QUIZZ Interactive 3D WebGL Arena initialized successfully.");
            loadStagesData();
        }