// ===========================================
// attack.js - Attack / damage particle effects
// ===========================================

        function spawn3DParticles(position, count, color) {
            for (let i = 0; i < count; i++) {
                const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
                const mat = new THREE.MeshBasicMaterial({ color: color });
                const mesh = new THREE.Mesh(geo, mat);
                
                mesh.position.copy(position);
                mesh.position.x += (Math.random() - 0.5) * 1.5;
                mesh.position.y += (Math.random() - 0.5) * 1.5;
                mesh.position.z += (Math.random() - 0.5) * 1.5;

                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.25,
                    (Math.random() * 0.15) + 0.1,
                    (Math.random() - 0.5) * 0.25
                );

                scene.add(mesh);
                damageParticles.push({ mesh: mesh, velocity: vel, age: 0 });
            }
        }

// ===== Combat resolution (moved from game.js) =====
        function executePlayerAttack(xpReward) {
            playSynthSound('hit_boss');
            
            const damage = 10; // Exactly 10 HP per hit
            gameState.bossHp = Math.max(0, gameState.bossHp - damage);

            const isYuehan = gameState.user.selectedCharacter === 'yuehan';
            const yuehanStyle = isYuehan ? (Math.random() < 0.5 ? 'stone' : 'chakram') : null;

            // ===== ท่าโจมตีของตัวละครที่ 2: หลินเฟิง (เซียนกระบี่เหลี่ยม) =====
            const isCharacter2 = gameState.user.selectedCharacter === 'character2';
            const linfengStyle = isCharacter2 ? (Math.random() < 0.5 ? 'slash' : 'beam') : null;

            // ===== ท่าโจมตีของตัวละครที่ 3: เหลย เจิ้น (เทพจอมสายฟ้า) =====
            const isCharacter3 = gameState.user.selectedCharacter === 'character3';
            const raijinStyle = isCharacter3 ? (Math.random() < 0.5 ? 'blink' : 'warp') : null;

            // Perk: "ลมหายใจสุดขั้วเยือกแข็ง" — 20% chance to freeze the boss for
            // one turn so it skips its next counterattack entirely.
            let didFreezeBoss = false;
            if (isYuehan && !gameState.isBossFrozen && Math.random() < 0.2) {
                gameState.isBossFrozen = true;
                didFreezeBoss = true;
            }

            // Perk: "ประสานกระบี่เทวะสามเล่ม" — 20% chance the 3 floating swords
            // pile on with an extra strike, dealing +5 bonus HP damage to the boss.
            let didTripleSword = false;
            const tripleSwordBonus = 5;
            if (isCharacter2 && Math.random() < 0.2) {
                didTripleSword = true;
                gameState.bossHp = Math.max(0, gameState.bossHp - tripleSwordBonus);
            }

            const sub = STAGES_DATA[gameState.selectedCategoryId].subStages.find(s => s.id === gameState.currentSubStageIndex);
            if (isYuehan) {
                let flavorText = yuehanStyle === 'stone'
                    ? `🔮 <span class="text-cyan-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> เย่ว์หานปลุกเสกศิลาเยือกแข็งทะลวงวิญญาณใส่ศัตรู!`
                    : `❄️ <span class="text-sky-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> กรงจักรวายุสิบวิถีหมุนควงพุ่งเข้าฟันศัตรูอย่างรวดเร็ว!`;
                if (didFreezeBoss) {
                    flavorText += ` <span class="text-sky-400 font-extrabold">❄️ ลมหายใจสุดขั้วเยือกแข็งกำเริบ! บอสถูกแช่แข็งข้ามเทิร์นถัดไป!</span>`;
                }
                document.getElementById("combatLogText").innerHTML = flavorText;
            } else if (isCharacter2) {
                let flavorText = linfengStyle === 'slash'
                    ? `🗡️ <span class="text-cyan-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> หลินเฟิงฟันดาบพิกเซลสวรรค์ทะลวงเกราะศัตรู!`
                    : `🔮 <span class="text-cyan-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> หลินเฟิงระดมก้อนพลังเวทย์บล็อกศักดิ์สิทธิ์พุ่งใส่ศัตรู!`;
                if (didTripleSword) {
                    flavorText += ` <span class="text-cyan-400 font-extrabold">⚔️ ประสานกระบี่เทวะสามเล่มกำเริบ! กระบี่ลอยรุมสับซ้ำ เพิ่มดาเมจอีก ${tripleSwordBonus} HP!</span>`;
                }
                document.getElementById("combatLogText").innerHTML = flavorText;
            } else if (isCharacter3) {
                let flavorText = raijinStyle === 'blink'
                    ? `⚡ <span class="text-amber-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> เหลย เจิ้น ก้าวพริบตาทะลวงมิติแทงทวนสายฟ้าใส่ศัตรู!`
                    : `⚡ <span class="text-amber-300 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> เหลย เจิ้น วาร์ปรัวรอบทิศแล้วฟาดสายฟ้าจากฟากฟ้าใส่ศัตรู!`;
                document.getElementById("combatLogText").innerHTML = flavorText;
            } else {
                document.getElementById("combatLogText").innerHTML = `<span class="text-emerald-400 font-extrabold">ตอบถูกตรงประเด็น (+${xpReward} XP)!</span> โมเดล 3D ฮีโร่ของคุณพุ่งฟันใส่ศัตรูอย่างสง่างาม`;
            }

            // HTML Overlay effect
            const bossDmgSplat = document.getElementById("bossDmgSplat");
            bossDmgSplat.textContent = `-${damage} HP`;
            bossDmgSplat.classList.remove("hidden");
            bossDmgSplat.classList.add("dmg-float");

            setTimeout(() => {
                bossDmgSplat.classList.add("hidden");
                bossDmgSplat.classList.remove("dmg-float");
            }, 1200);

            // ThreeJS 3D Combat Physics
            if (is3DInitialized) {
                if (isYuehan) {
                    // Yuehan gets her own cinematic spell instead of a generic sword swing
                    triggerYuehanSpellAttack(yuehanStyle);
                } else if (isCharacter2) {
                    // Lin Feng gets his own cinematic sword-immortal attack
                    triggerLinfengSpellAttack(linfengStyle, didTripleSword);
                } else if (isCharacter3) {
                    // เหลย เจิ้น gets his own cinematic lightning-speed warp attack
                    triggerRaijinSpellAttack(raijinStyle);
                } else {
                    const hitColor = 0x06b6d4;

                    // Dash Forward physics coordinate
                    targetPlayerPos.set(-0.8, -0.5, 0.5);

                    // Glow flash
                    hitLightFlash = 1.0;
                    hitLightColor = hitColor;

                    const sword = playerGroup.getObjectByName("sword_blade");
                    if (sword) sword.rotation.z = -1.5;

                    setTimeout(() => {
                        // Spawn sparkling particles at the hit location
                        spawn3DParticles(bossGroup.position, 15, hitColor);

                        // Push player mesh back to origin
                        targetPlayerPos.set(-3.5, -0.5, 0);

                        // Reset weapon pose
                        if (sword) sword.rotation.z = -0.3;

                        // Shake boss slightly
                        bossGroup.rotation.z = -0.5;
                        setTimeout(() => { bossGroup.rotation.z = 0; }, 200);
                    }, 300);
                }
            }

            if (didFreezeBoss) {
                const freezeIcon = document.getElementById("hudFreezeIcon");
                if (freezeIcon) freezeIcon.classList.remove("hidden");
            }

            updateHpBars();
        }

        // ===== Yuehan cinematic special attacks (ported from 3d_voxel_ice_mage_arena.html) =====
        // Instead of the generic sword swing, correct answers trigger one of two
        // signature spells that fly across the arena and hit the boss.
        // Damage is already applied by executePlayerAttack — these are visual/audio only.
        function triggerYuehanSpellAttack(style) {
            playSynthSound('charge');

            // Float the mage up briefly to wind up the spell
            targetPlayerPos.set(-1.8, 0.2, 0.3);

            const weaponStone = playerGroup.getObjectByName("sword_blade");
            const krongChak = playerGroup.getObjectByName("spinning_back_wheel");

            if (style === 'stone' && weaponStone) {
                weaponStone.scale.set(1.8, 1.8, 1.8);
            } else if (style === 'chakram' && krongChak) {
                krongChak.visible = false; // hidden on her back right before it's thrown
            }

            setTimeout(() => {
                playSynthSound('blast');
                targetPlayerPos.set(-3.5, -0.5, 0);
                if (weaponStone) weaponStone.scale.set(1, 1, 1);

                if (style === 'stone') {
                    spawnYuehanStoneRain();
                } else {
                    spawnYuehanChakramStorm();
                    if (krongChak) krongChak.visible = true;
                }
            }, 500);
        }

        function spawnYuehanStoneRain() {
            // Giant crystalline ice monolith that drops from the sky onto the boss
            const crystalMat = new THREE.MeshStandardMaterial({
                color: 0x00f3ff, emissive: 0x0088ff, emissiveIntensity: 0.6,
                roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85
            });
            const projGroup = new THREE.Group();
            const coreBlock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), crystalMat);
            projGroup.add(coreBlock);
            const tip1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), crystalMat);
            tip1.position.y = -0.9;
            tip1.rotation.x = Math.PI;
            projGroup.add(tip1);
            const tip2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), crystalMat);
            tip2.position.y = 0.9;
            projGroup.add(tip2);

            const satellites = [];
            for (let k = 0; k < 6; k++) {
                const sat = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.1, 0.1),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
                );
                sat.position.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
                projGroup.add(sat);
                satellites.push(sat);
            }

            // Drops in from high above the boss
            projGroup.position.set(bossGroup.position.x, 6.0, bossGroup.position.z);
            scene.add(projGroup);

            activeProjectiles.push({
                group: projGroup,
                satellites: satellites,
                startPos: new THREE.Vector3(bossGroup.position.x, 6.0, bossGroup.position.z),
                targetPos: new THREE.Vector3().copy(bossGroup.position).add(new THREE.Vector3(0, 0.3, 0)),
                progress: 0,
                speed: 0.05,
                isParabolic: false
            });
        }

        function spawnYuehanChakramStorm() {
            // Giant spinning ice wheel (Krong Chak) that flies straight across to the boss
            const shaderGlow = new THREE.ShaderMaterial({
                vertexShader: iceMageVertexShader,
                fragmentShader: iceMageFragmentShader,
                uniforms: iceMageUniforms,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const projGroup = new THREE.Group();
            const wheelRim = new THREE.Mesh(
                new THREE.TorusGeometry(0.85, 0.08, 8, 32),
                new THREE.MeshStandardMaterial({ color: 0x00aeff, roughness: 0.2, metalness: 0.9 })
            );
            projGroup.add(wheelRim);

            const spikeCount = 6;
            for (let k = 0; k < spikeCount; k++) {
                const angle = (k / spikeCount) * Math.PI * 2;
                const spikeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.40, 4), shaderGlow);
                spikeMesh.position.y = 1.0;
                spikeMesh.rotation.y = Math.PI / 4;
                const spikeGroup = new THREE.Group();
                spikeGroup.add(spikeMesh);
                spikeGroup.rotation.z = angle;
                projGroup.add(spikeGroup);
            }

            projGroup.position.copy(playerGroup.position).add(new THREE.Vector3(0.3, 0.6, 0));
            projGroup.rotation.x = Math.PI / 2;
            scene.add(projGroup);

            activeProjectiles.push({
                group: projGroup,
                satellites: [],
                startPos: new THREE.Vector3().copy(projGroup.position),
                targetPos: new THREE.Vector3().copy(bossGroup.position).add(new THREE.Vector3(0, 0.6, 0)),
                progress: 0,
                speed: 0.06,
                isParabolic: false
            });
        }

        // ===== Lin Feng (character2) cinematic special attacks =====
        // Instead of the generic sword swing, correct answers trigger one of two
        // signature moves: a converging pixel-sword slash, or a floating spirit-orb
        // barrage. Damage is already applied by executePlayerAttack — these are
        // visual/audio only (plus the bonus triple-sword hit spawns its own sparks).
        function triggerLinfengSpellAttack(style, didTripleSword) {
            playSynthSound('charge');

            targetPlayerPos.set(-2.2, -0.4, -0.2);
            const mainSword = playerGroup.getObjectByName("sword_blade");
            if (mainSword) mainSword.rotation.set(-1.4, 0.3, -0.8);

            if (heroFloatingSwords && heroFloatingSwords.length > 0) {
                heroFloatingSwords.forEach((s, idx) => {
                    s.position.set(playerGroup.position.x + 0.3, playerGroup.position.y + 0.5 + idx * 0.2, playerGroup.position.z + 0.1);
                    s.rotation.set(0, 0, Math.PI / 2);
                });
            }

            setTimeout(() => {
                playSynthSound('slash');
                targetPlayerPos.set(-3.5, -0.5, 0);
                if (mainSword) mainSword.rotation.set(-0.5, 0.1, -0.4);

                if (style === 'slash') {
                    spawnLinfengSlash();
                } else {
                    spawnLinfengSpiritBeam();
                }

                if (didTripleSword) {
                    // Extra converging strike from all 3 floating swords for the bonus damage
                    setTimeout(() => spawnLinfengTripleSwordBonus(), 350);
                }
            }, 500);
        }

        function spawnLinfengSlash() {
            // Floating swords converge onto the boss for a pixel-blade flourish
            if (heroFloatingSwords && heroFloatingSwords.length > 0) {
                heroFloatingSwords.forEach((s) => {
                    s.position.set(bossGroup.position.x - 0.4, bossGroup.position.y + 0.4, bossGroup.position.z);
                    s.rotation.set(0, 0, Math.PI / 2);
                });
            }

            if (slashArcMesh) {
                slashArcMesh.position.copy(bossGroup.position);
                slashArcMesh.position.y += 0.4;
                slashArcMesh.scale.set(0.25, 0.25, 0.25);
                slashArcMesh.material.color.setHex(0x22d3ee);
                slashArcMesh.material.opacity = 0.95;
                setTimeout(() => { slashArcMesh.material.opacity = 0; }, 300);
            }

            spawn3DParticles(bossGroup.position, 20, 0x22d3ee);

            bossGroup.rotation.z = -0.2;
            setTimeout(() => { bossGroup.rotation.z = 0; }, 150);
        }

        function spawnLinfengSpiritBeam() {
            // A glowing voxel orb with orbiting golden satellites flies to the boss
            const beamCoreMat = new THREE.MeshBasicMaterial({
                color: 0x22d3ee, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending
            });
            const projGroup = new THREE.Group();
            const coreCube = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), beamCoreMat);
            projGroup.add(coreCube);

            const satellites = [];
            for (let k = 0; k < 5; k++) {
                const sat = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.12, 0.12),
                    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
                );
                sat.position.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
                projGroup.add(sat);
                satellites.push(sat);
            }

            projGroup.position.copy(playerGroup.position).add(new THREE.Vector3(0.3, 0.5, 0.1));
            scene.add(projGroup);

            activeProjectiles.push({
                group: projGroup,
                satellites: satellites,
                startPos: new THREE.Vector3().copy(projGroup.position),
                targetPos: new THREE.Vector3().copy(bossGroup.position).add(new THREE.Vector3(0, 0.6, 0)),
                progress: 0,
                speed: 0.055,
                isParabolic: false
            });
        }

        function spawnLinfengTripleSwordBonus() {
            // Bonus visual for the "ประสานกระบี่เทวะสามเล่ม" perk trigger
            if (heroFloatingSwords && heroFloatingSwords.length > 0) {
                heroFloatingSwords.forEach((s, idx) => {
                    setTimeout(() => {
                        s.position.set(
                            bossGroup.position.x - 0.2 + idx * 0.15,
                            bossGroup.position.y + 0.3 + idx * 0.1,
                            bossGroup.position.z
                        );
                    }, idx * 90);
                });
            }

            spawn3DParticles(bossGroup.position, 15, 0xfacc15);

            const bossSplat = document.getElementById("bossDmgSplat");
            if (bossSplat) {
                bossSplat.textContent = `-5 HP ⚔️`;
                bossSplat.classList.remove("hidden");
                bossSplat.classList.add("dmg-float");
                setTimeout(() => {
                    bossSplat.classList.add("hidden");
                    bossSplat.classList.remove("dmg-float");
                }, 1200);
            }
        }

        // ===== เหลย เจิ้น (character3) cinematic special attacks (ported & enhanced from voxel_lightning_speed_arena.html) =====
        // Instead of the generic sword swing, correct answers trigger one of two
        // signature lightning-speed moves: a single teleport-strike ("Blink Strike"),
        // or a flurry of rapid warps around the boss finished by an overhead thunder
        // slam ("Multi Warp Strike"). Damage is already applied by executePlayerAttack
        // — these are visual/audio only.

        // Small helper: punches the screen with a colored flash + arena shake for
        // an instant, then fades it back out. Reuses the same #flashOverlay /
        // .shake-hit combo executeEnemyCounter already uses for boss hits, so
        // Raijin's strikes get the same "screen impact" weight as taking damage.
        function flashArenaScreen(tailwindBgClass, durationMs = 140) {
            const arenaVisual = document.getElementById("battleArenaVisual");
            const flashOverlay = document.getElementById("flashOverlay");
            if (!arenaVisual || !flashOverlay) return;

            arenaVisual.classList.add("shake-hit");
            flashOverlay.className = `absolute inset-0 ${tailwindBgClass} pointer-events-none transition-all duration-100 z-10`;

            setTimeout(() => {
                arenaVisual.classList.remove("shake-hit");
                flashOverlay.className = "absolute inset-0 bg-amber-400/0 pointer-events-none transition-all duration-300 z-10";
            }, durationMs);
        }

        function triggerRaijinSpellAttack(style) {
            playSynthSound('charge');

            // Crouch down and spin up briefly, channeling lightning speed before blinking in
            targetPlayerPos.set(-2.0, -0.6, 0.2);
            playerGroup.rotation.y += Math.PI * 2; // full spin-up flourish while charging

            const spear = playerGroup.getObjectByName("lightning_spear_weapon");
            const halo = playerGroup.getObjectByName("spinning_back_wheel");
            const aura = playerGroup.getObjectByName("playerAura");

            // Charging sparks crackling off the body while winding up
            spawn3DParticles(playerGroup.position, 10, 0xfef08a);
            if (aura) {
                aura.scale.set(1.4, 1.4, 1.4);
                setTimeout(() => aura.scale.set(1, 1, 1), 500);
            }

            setTimeout(() => {
                playSynthSound('slash');

                if (style === 'blink') {
                    spawnRaijinBlinkStrike(spear);
                } else {
                    spawnRaijinMultiWarpStrike(spear, halo);
                }
            }, 500);
        }

        function spawnRaijinBlinkStrike(spear) {
            // Teleport right in front of the boss for a single lightning-fast spear thrust
            playerGroup.position.set(1.0, -0.4, 0.2);
            playerGroup.lookAt(bossGroup.position);
            playerGroup.rotation.y += Math.PI; // face the boss after the lookAt flip

            // Thrust the spear forward on impact, then settle back to its resting pose
            if (spear) {
                spear.rotation.set(0.05, 0.1, -0.05);
                setTimeout(() => spear.rotation.set(0.6, 0.2, -0.4), 220);
            }

            if (slashArcMesh) {
                slashArcMesh.position.copy(bossGroup.position);
                slashArcMesh.position.y += 0.5;
                slashArcMesh.scale.set(0.35, 0.35, 0.35);
                slashArcMesh.material.color.setHex(0xfacc15);
                slashArcMesh.material.opacity = 1.0;
                setTimeout(() => { slashArcMesh.material.opacity = 0; }, 320);
            }

            if (shockwaveRingMesh) {
                shockwaveRingMesh.position.copy(bossGroup.position);
                shockwaveRingMesh.position.y = -1.35;
                shockwaveRingMesh.scale.set(0.25, 0.25, 0.25);
                shockwaveRingMesh.material.color.setHex(0xfacc15);
                shockwaveRingMesh.material.opacity = 0.9;
            }

            cameraShakeTime = 0.5;
            hitLightFlash = 1.0;
            hitLightColor = 0xfacc15;
            flashArenaScreen("bg-amber-400/25", 140);

            // Layered burst: hot white core + golden trail + a few lingering embers
            spawn3DParticles(bossGroup.position, 10, 0xffffff);
            spawn3DParticles(bossGroup.position, 24, 0xfacc15);
            spawn3DParticles(bossGroup.position, 12, 0xfef08a);

            bossGroup.rotation.z = -0.45;
            bossGroup.position.y += 0.08;
            setTimeout(() => {
                bossGroup.rotation.z = 0;
                bossGroup.position.y -= 0.08;
            }, 180);

            setTimeout(() => {
                targetPlayerPos.set(-3.5, -0.5, 0);
                playerGroup.rotation.set(0, 0, 0);
            }, 280);
        }

        function spawnRaijinMultiWarpStrike(spear, halo) {
            // Rapid warps circling the boss before a final overhead thunder slam
            if (spear) spear.visible = false;
            if (halo) halo.visible = false;

            let warpsDone = 0;
            const maxWarps = 4;

            const warpInterval = setInterval(() => {
                if (warpsDone >= maxWarps) {
                    clearInterval(warpInterval);

                    // Overhead thunder slam
                    playSynthSound('blast');
                    playerGroup.position.set(bossGroup.position.x, 2.2, bossGroup.position.z + 0.5);
                    playerGroup.rotation.set(Math.PI / 3, 0, 0);

                    // Brief golden "charging up above the boss" beat before the slam lands
                    spawn3DParticles(playerGroup.position, 14, 0xfef08a);

                    setTimeout(() => {
                        playSynthSound('impact');
                        cameraShakeTime = 1.0;
                        hitLightFlash = 1.0;
                        hitLightColor = 0xfff59d;
                        flashArenaScreen("bg-amber-300/35", 180);

                        if (shockwaveRingMesh) {
                            shockwaveRingMesh.position.copy(bossGroup.position);
                            shockwaveRingMesh.position.y = -1.35;
                            shockwaveRingMesh.scale.set(0.2, 0.2, 0.2);
                            shockwaveRingMesh.material.color.setHex(0xfff59d);
                            shockwaveRingMesh.material.opacity = 1.0;
                        }

                        // Big layered finisher burst: white-hot core, gold ring, pale embers
                        spawn3DParticles(bossGroup.position, 15, 0xffffff);
                        spawn3DParticles(bossGroup.position, 35, 0xfacc15);
                        spawn3DParticles(bossGroup.position, 20, 0xfef08a);

                        bossGroup.rotation.z = -0.55;
                        bossGroup.position.y += 0.1;
                        setTimeout(() => {
                            bossGroup.rotation.z = 0;
                            bossGroup.position.y -= 0.1;
                        }, 180);

                        document.getElementById("combatLogText").innerHTML = `💥 <span class="text-amber-300 font-extrabold">กระบวนท่าปิดฉาก "มหาสายฟ้าสยบโลกันตร์"!</span> เหลย เจิ้น ฟาดสายฟ้าจากฟากฟ้าลงใส่ศัตรูเต็มแรง!`;

                        setTimeout(() => {
                            targetPlayerPos.set(-3.5, -0.5, 0);
                            playerGroup.rotation.set(0, 0, 0);
                            if (spear) spear.visible = true;
                            if (halo) halo.visible = true;
                        }, 320);
                    }, 220);

                    return;
                }

                // Intermediate warp teleport around the boss, each one crackling with sparks
                warpsDone++;
                playSynthSound('slash');

                const angle = Math.random() * Math.PI * 2;
                const dist = 1.1 + Math.random() * 0.5;
                const wx = bossGroup.position.x + Math.cos(angle) * dist;
                const wz = bossGroup.position.z + Math.sin(angle) * dist;
                const wy = bossGroup.position.y + 0.2;

                playerGroup.position.set(wx, wy, wz);
                playerGroup.lookAt(bossGroup.position);

                if (slashArcMesh) {
                    slashArcMesh.position.copy(bossGroup.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.35, (Math.random() - 0.5) * 0.2));
                    slashArcMesh.scale.set(0.22, 0.22, 0.22);
                    slashArcMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    slashArcMesh.material.color.setHex(0xfacc15);
                    slashArcMesh.material.opacity = 0.95;
                }

                // Quick strobe flash + mini particle burst per warp, escalating slightly each hit
                hitLightFlash = 0.6;
                hitLightColor = 0xfef08a;
                cameraShakeTime = 0.25;
                spawn3DParticles(bossGroup.position, 6 + warpsDone * 2, warpsDone % 2 === 0 ? 0xfacc15 : 0xfef08a);

                document.getElementById("combatLogText").innerHTML = `⚡ <span class="text-amber-300 font-bold">พริบตาวาร์ปครั้งที่ ${warpsDone}... ฉีกมุมทะลวงข้ามมิติ!</span>`;

            }, 150);
        }

        function executeEnemyCounter() {
            playSynthSound('hit_player');

            let damage = 10; // 10 HP damage
            
            // gameState.isShieldActive ยังไม่มีตัวละครไหนตั้งค่าเป็น true จริงๆ ในตอนนี้
            // (เพิร์คตัวละคร "กิก้า" เดิมถูกถอดออก) — เผื่อไว้สำหรับตัวละครที่ 2/3 ในอนาคต
            // ที่อาจมีเพิร์คแบบกางโล่พิทักษ์
            if (gameState.isShieldActive) {
                gameState.isShieldActive = false;
                damage = 0;
                
                const shieldIcon = document.getElementById("hudShieldIcon");
                if (shieldIcon) shieldIcon.classList.add("hidden");

                document.getElementById("combatLogText").innerHTML = `🛡️ <span class="text-cyan-400 font-extrabold">เกราะพิทักษ์ดูดซับการโจมตี!</span> ไม่โดนลดพลังชีวิต`;
            } else if (gameState.isBossFrozen) {
                gameState.isBossFrozen = false;
                damage = 0;

                const freezeIcon = document.getElementById("hudFreezeIcon");
                if (freezeIcon) freezeIcon.classList.add("hidden");

                document.getElementById("combatLogText").innerHTML = `❄️ <span class="text-sky-400 font-extrabold">บอสยังคงถูกตรึงด้วยน้ำแข็งของเย่ว์หาน!</span> ไม่สามารถโต้กลับได้ในรอบนี้`;
            } else {
                const sub = STAGES_DATA[gameState.selectedCategoryId].subStages.find(s => s.id === gameState.currentSubStageIndex);
                if (gameState.user.selectedCharacter === 'yuehan') {
                    document.getElementById("combatLogText").innerHTML = `⚠️ <span class="text-rose-500 font-extrabold">วิเคราะห์คลาดเคลื่อน!</span> บอสสวนกลับฉีกทะลวงเกราะน้ำแข็งของเย่ว์หาน!`;
                } else if (gameState.user.selectedCharacter === 'character2') {
                    document.getElementById("combatLogText").innerHTML = `⚠️ <span class="text-rose-500 font-extrabold">วิเคราะห์คลาดเคลื่อน!</span> บอสสวนกลับฟาดใส่เกราะกระบี่ของหลินเฟิงจนเซถอย!`;
                } else if (gameState.user.selectedCharacter === 'character3') {
                    document.getElementById("combatLogText").innerHTML = `⚠️ <span class="text-rose-500 font-extrabold">วิเคราะห์คลาดเคลื่อน!</span> บอสสวนกลับทันควันก่อนเหลย เจิ้นจะก้าวพริบตาหลบทัน!`;
                } else {
                    document.getElementById("combatLogText").innerHTML = `<span class="text-rose-500 font-extrabold">วิเคราะห์คลาดเคลื่อน!</span> บอสระดับย่อยกระแทกคลื่นทำความเสียหายคุณ`;
                }
            }

            gameState.playerHp = Math.max(0, gameState.playerHp - damage);

            // HTML splat layout
            const playerDmgSplat = document.getElementById("playerDmgSplat");
            playerDmgSplat.textContent = damage > 0 ? `-${damage} HP` : `🛡️ BLOCKED`;
            playerDmgSplat.classList.remove("hidden");
            playerDmgSplat.classList.add("dmg-float");

            // Flash Screen Red
            const arenaVisual = document.getElementById("battleArenaVisual");
            const flashOverlay = document.getElementById("flashOverlay");
            arenaVisual.classList.add("shake-hit");
            flashOverlay.className = "absolute inset-0 bg-red-600/15 pointer-events-none transition-all duration-100 z-10";

            setTimeout(() => {
                playerDmgSplat.classList.add("hidden");
                playerDmgSplat.classList.remove("dmg-float");
                arenaVisual.classList.remove("shake-hit");
                flashOverlay.className = "absolute inset-0 bg-red-600/0 pointer-events-none transition-all duration-300 z-10";
            }, 1200);

            // ThreeJS 3D counter strike mesh physics and camera shake
            if (is3DInitialized && damage > 0) {
                // Trigger 3D Camera Shake
                cameraShakeTime = 0.5;

                // Glow flash red
                hitLightFlash = 1.0;
                hitLightColor = 0xf43f5e;

                // Dash Boss Mesh forward
                targetBossPos.set(0.8, -0.5, 0.5);
                setTimeout(() => {
                    spawn3DParticles(playerGroup.position, 10, 0xf43f5e);
                    // Push Boss back to origin
                    targetBossPos.set(3.5, -0.5, 0);
                    // Shake player
                    playerGroup.rotation.z = 0.5;
                    setTimeout(() => { playerGroup.rotation.z = 0; }, 200);
                }, 300);
            }

            updateHpBars();
        }

        function updateHpBars() {
            const playerPercent = `${gameState.playerHp}%`;
            const bossPercent = `${gameState.bossHp}%`;

            document.getElementById("playerHpBar").style.width = playerPercent;
            document.getElementById("bossHpBar").style.width = bossPercent;

            document.getElementById("playerHpText").textContent = `${gameState.playerHp} / 100`;
            document.getElementById("bossHpText").textContent = `${gameState.bossHp} / 100`;

            const playerBar = document.getElementById("playerHpBar");
            if (gameState.playerHp <= 30) {
                playerBar.className = "bg-gradient-to-r from-red-500 to-rose-500 h-full w-full transition-all duration-300 animate-pulse";
            } else if (gameState.playerHp <= 60) {
                playerBar.className = "bg-gradient-to-r from-amber-500 to-yellow-400 h-full w-full transition-all duration-300";
            } else {
                playerBar.className = "bg-gradient-to-r from-emerald-500 to-green-400 h-full w-full transition-all duration-300";
            }

            const bossBar = document.getElementById("bossHpBar");
            if (gameState.bossHp <= 30) {
                bossBar.className = "bg-gradient-to-r from-red-500 to-rose-500 h-full w-full transition-all duration-300 animate-pulse";
            } else {
                bossBar.className = "bg-gradient-to-r from-rose-500 to-pink-500 h-full w-full transition-all duration-300";
            }
        }