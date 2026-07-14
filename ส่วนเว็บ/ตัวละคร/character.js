// ===========================================
// character.js - Character & Boss data, 3D models, character selection
// ===========================================

        const CHARACTERS = {
            yuehan: {
                id: "yuehan",
                name: "เย่ว์หาน (Yuehan)",
                role: "จอมเวทน้ำแข็งเทวะ ☯️❄️",
                themeColor: "sky",
                activeColor: "#38bdf8",
                unlockedAt: 0,
                desc: "จอมเวทหญิงชุดเทพบุ๋น Neo Blue ผมขาวยาวสยาย พร้อมมงกุฎน้ำแข็ง คทาคริสตัล และกงล้อหนามเยือกแข็งหมุนอยู่เบื้องหลัง!",
                perkTitle: "ลมหายใจสุดขั้วเยือกแข็ง ❄️",
                perkDesc: "เมื่อตอบคำถามถูกต้อง มีโอกาส 20% แช่แข็งบอสข้ามเทิร์น ทำให้ไม่โดนโจมตีในรอบนั้น!",
                colorHex: 0x38bdf8,
                accessoryType: 'wheel'
            },
            // ===== ตัวละครที่ 2: หลินเฟิง (เซียนกระบี่เหลี่ยม) — มีโมเดล 3D แล้ว =====
            // ท่าโจมตีเฉพาะตัวยังต้องไปเพิ่มใน attack.js (ค้นหาคอมเมนต์ "ตัวละครที่ 2 / 3")
            character2: {
                id: "character2",
                name: "หลินเฟิง (เซียนกระบี่เหลี่ยม)",
                role: "เซียนกระบี่วอกเซลจอมเวหา ⚔️✨",
                themeColor: "cyan",
                activeColor: "#22d3ee",
                unlockedAt: 3,
                desc: "เซียนกระบี่ชุดขาวสไตล์วอกเซล ผมมวยปักปิ่นทอง ห้อมล้อมด้วยกระบี่แสงไซแอนลอยได้ 3 เล่ม พร้อมกระบี่หลักเรืองแสงพลังงานเทวะในมือ",
                perkTitle: "ประสานกระบี่เทวะสามเล่ม ⚔️",
                perkDesc: "เมื่อตอบคำถามถูกต้อง มีโอกาส 20% ให้กระบี่ลอยทั้ง 3 เล่มรุมโจมตีเสริมทันที เพิ่มดาเมจพิเศษให้บอส!",
                colorHex: 0x22d3ee,
                accessoryType: 'floating_swords'
            },
            character3: {
                id: "character3",
                name: "เหลย เจิ้น (เทพจอมสายฟ้า)",
                role: "เทพเจ้าสายฟ้าความเร็วแสง ⚡👑",
                themeColor: "amber",
                activeColor: "#facc15",
                unlockedAt: 6,
                desc: "เทพบุตรชุดทองอัมพันธ์ ผมสีครีมสยาย มงกุฎสายฟ้า ถือทวนพลังสายฟ้ายาว พร้อมวงล้อราชันสายฟ้า (Raijin Halo) หมุนอยู่เบื้องหลัง!",
                perkTitle: "??? 🔒",
                perkDesc: "สกิลพิเศษกำลังอยู่ระหว่างการพัฒนา (รอเพิ่มใน attack.js)",
                colorHex: 0xfacc15,
                accessoryType: 'lightning_spear'
            }
        };

        // ===== Ice Mage (Yuehan) 3D dependencies =====
        let heroIceMistClusters = [];

        const iceMageVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
        const iceMageFragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
            void main() {
                float energy = sin(vUv.y * 12.0 - uTime * 6.0) * 0.5 + 0.5;
                float rune = step(0.85, sin(vUv.y * 35.0 + rand(vec2(vUv.y, 0.0)) * 8.0)) * step(0.2, vUv.x) * step(vUv.x, 0.8);
                vec3 baseGlow = uColor * (1.1 + energy * 0.9);
                vec3 runeColor = vec3(0.8, 0.95, 1.0) * rune * (sin(uTime * 8.0) * 0.4 + 0.6);
                float edge = pow(abs(vUv.x - 0.5) * 2.0, 3.0);
                vec3 edgeColor = vec3(0.88, 0.98, 1.0) * edge * 2.5;
                gl_FragColor = vec4(baseGlow + runeColor + edgeColor, 0.95);
            }
        `;
        const iceMageUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x38bdf8) } };

        function createNeoChineseDeityRobeTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 512);
            grad.addColorStop(0, '#02001a');
            grad.addColorStop(0.3, '#0033aa');
            grad.addColorStop(0.7, '#0099ff');
            grad.addColorStop(1, '#00f3ff');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 8;
            function drawChineseCloud(x, y, scale) {
                ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
                ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 1.8); ctx.stroke();
                ctx.beginPath(); ctx.arc(35, -5, 18, 0.5, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(-25, 8, 14, 0, Math.PI * 1.7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-25, 8); ctx.quadraticCurveTo(-50, 30, -10, 45); ctx.quadraticCurveTo(10, 55, 30, 40); ctx.stroke();
                ctx.restore();
            }
            drawChineseCloud(100, 110, 0.9); drawChineseCloud(410, 320, 0.85);
            drawChineseCloud(250, 230, 1.1); drawChineseCloud(120, 390, 0.7); drawChineseCloud(390, 90, 0.8);
            ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 8; ctx.shadowColor = '#00f3ff';
            ctx.beginPath();
            for (let i = 0; i < 512; i += 64) { ctx.arc(i + 32, 512, 32, Math.PI, 0, false); }
            ctx.stroke();
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 475); ctx.lineTo(512, 475); ctx.stroke();
            return new THREE.CanvasTexture(canvas);
        }
        // ===== End Ice Mage dependencies =====

        // ===== Lin Feng (Sword Immortal / character2) 3D dependencies =====
        let heroFloatingSwords = [];

        const linfengSwordVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
        const linfengSwordFragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
            void main() {
                float energy = sin(vUv.y * 15.0 - uTime * 8.0) * 0.5 + 0.5;
                float rune = step(0.8, sin(vUv.y * 40.0 + rand(vec2(vUv.y, 0.0)) * 10.0)) * step(0.3, vUv.x) * step(vUv.x, 0.7);
                vec3 baseGlow = uColor * (1.2 + energy * 0.8);
                vec3 runeColor = vec3(1.0) * rune * (sin(uTime * 10.0) * 0.5 + 0.5 + 0.5);
                float edge = pow(abs(vUv.x - 0.5) * 2.0, 4.0);
                vec3 edgeColor = uColor * edge * 3.0;
                gl_FragColor = vec4(baseGlow + runeColor + edgeColor, 0.95);
            }
        `;
        const linfengSwordUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x00ffff) } };
        // ===== End Lin Feng dependencies =====

        // ===== เหลย เจิ้น เทพจอมสายฟ้า (character3) 3D dependencies =====
        function createRaijinLightningRobeTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 512);
            grad.addColorStop(0, '#0a0a16');
            grad.addColorStop(0.4, '#0d1127');
            grad.addColorStop(0.8, '#1e1c3a');
            grad.addColorStop(1, '#ffb700');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            function drawChineseCloud(x, y, scale) {
                ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
                ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 1.8); ctx.stroke();
                ctx.beginPath(); ctx.arc(35, -5, 18, 0.5, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(-25, 8, 14, 0, Math.PI * 1.7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-25, 8); ctx.quadraticCurveTo(-50, 30, -10, 45); ctx.quadraticCurveTo(10, 55, 30, 40); ctx.stroke();
                ctx.restore();
            }
            drawChineseCloud(100, 110, 0.9); drawChineseCloud(410, 320, 0.85);
            drawChineseCloud(250, 230, 1.1); drawChineseCloud(120, 390, 0.7); drawChineseCloud(390, 90, 0.8);
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 8;
            ctx.beginPath();
            for (let i = 0; i < 512; i += 64) { ctx.arc(i + 32, 512, 32, Math.PI, 0, false); }
            ctx.stroke();
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 475); ctx.lineTo(512, 475); ctx.stroke();
            return new THREE.CanvasTexture(canvas);
        }

        const raijinVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
        const raijinFragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
            void main() {
                float energy = sin(vUv.y * 18.0 - uTime * 15.0) * 0.5 + 0.5;
                float rune = step(0.85, sin(vUv.y * 45.0 + rand(vec2(vUv.y, 0.0)) * 10.0)) * step(0.15, vUv.x) * step(vUv.x, 0.85);
                vec3 baseGlow = uColor * (1.3 + energy * 1.5);
                vec3 runeColor = vec3(1.0, 0.9, 0.5) * rune * (sin(uTime * 12.0) * 0.3 + 0.7);
                float edge = pow(abs(vUv.x - 0.5) * 2.0, 3.0);
                vec3 edgeColor = vec3(1.0, 0.95, 0.75) * edge * 3.0;
                gl_FragColor = vec4(baseGlow + runeColor + edgeColor, 0.95);
            }
        `;
        const raijinSpearUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xfacc15) } };
        // ===== End เหลย เจิ้น dependencies =====

        function build3DPlayer(charKey) {
            if (!is3DInitialized) return;
            // Clear existing elements
            while(playerGroup.children.length > 0){
                playerGroup.remove(playerGroup.children[0]);
            }

            const char = CHARACTERS[charKey] || CHARACTERS.yuehan;
            
            // Premium Materials
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.55, metalness: 0.05 });
            const clothesPrimaryMat = new THREE.MeshStandardMaterial({ color: char.colorHex, roughness: 0.7, metalness: 0.1 });
            const darkAccentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
            const neonEnergyMat = new THREE.MeshStandardMaterial({ 
                color: char.colorHex, 
                emissive: char.colorHex, 
                emissiveIntensity: 1.2, 
                roughness: 0.1 
            });

            // --- 1. TORSO & APPAREL (Sleek Jacket / Robes) ---
            const torsoGeo = new THREE.CylinderGeometry(0.3, 0.22, 0.7, 12);
            const torso = new THREE.Mesh(torsoGeo, clothesPrimaryMat);
            torso.position.y = 0.55;
            torso.castShadow = true;
            torso.receiveShadow = true;
            playerGroup.add(torso);

            // Belt
            const beltGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12);
            const belt = new THREE.Mesh(beltGeo, darkAccentMat);
            belt.position.y = 0.22;
            belt.castShadow = true;
            playerGroup.add(belt);

            // Pelvis
            const pelvisGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.18, 12);
            const pelvis = new THREE.Mesh(pelvisGeo, clothesPrimaryMat);
            pelvis.position.y = 0.12;
            pelvis.castShadow = true;
            playerGroup.add(pelvis);

            // --- 2. HEAD AND FACE ---
            const headGeo = new THREE.SphereGeometry(0.22, 18, 18);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.y = 1.05;
            head.castShadow = true;
            playerGroup.add(head);

            // Neck
            const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.15, 8);
            const neck = new THREE.Mesh(neckGeo, skinMat);
            neck.position.y = 0.92;
            neck.castShadow = true;
            playerGroup.add(neck);

            // --- 3. SEGMENTED ARMS ---
            // Left Arm
            const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), clothesPrimaryMat);
            shoulderL.position.set(-0.38, 0.8, 0);
            playerGroup.add(shoulderL);

            const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35, 8), clothesPrimaryMat);
            upperArmL.position.set(-0.43, 0.6, 0);
            upperArmL.rotation.z = 0.15;
            upperArmL.castShadow = true;
            playerGroup.add(upperArmL);

            const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8), skinMat);
            forearmL.position.set(-0.46, 0.32, 0.1);
            forearmL.rotation.x = -0.3;
            forearmL.castShadow = true;
            playerGroup.add(forearmL);

            // Right Arm (Holding weapon position)
            const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), clothesPrimaryMat);
            shoulderR.position.set(0.38, 0.8, 0);
            playerGroup.add(shoulderR);

            const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35, 8), clothesPrimaryMat);
            upperArmR.position.set(0.43, 0.6, 0);
            upperArmR.rotation.z = -0.15;
            upperArmR.castShadow = true;
            playerGroup.add(upperArmR);

            const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8), skinMat);
            forearmR.position.set(0.48, 0.35, 0.15);
            forearmR.rotation.x = -0.6;
            forearmR.castShadow = true;
            playerGroup.add(forearmR);

            // --- 4. SEGMENTED LEGS & BOOTS ---
            const legColor = clothesPrimaryMat;

            // Left Leg
            const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.45, 8), legColor);
            thighL.position.set(-0.16, -0.15, 0);
            thighL.castShadow = true;
            playerGroup.add(thighL);

            const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.45, 8), legColor);
            shinL.position.set(-0.16, -0.55, 0);
            shinL.castShadow = true;
            playerGroup.add(shinL);

            const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), darkAccentMat);
            bootL.position.set(-0.16, -0.85, 0.04);
            bootL.castShadow = true;
            playerGroup.add(bootL);

            // Right Leg
            const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.45, 8), legColor);
            thighR.position.set(0.16, -0.15, 0);
            thighR.castShadow = true;
            playerGroup.add(thighR);

            const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.45, 8), legColor);
            shinR.position.set(0.16, -0.55, 0);
            shinR.castShadow = true;
            playerGroup.add(shinR);

            const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), darkAccentMat);
            bootR.position.set(0.16, -0.85, 0.04);
            bootR.castShadow = true;
            playerGroup.add(bootR);


            // --- 5. HIGH-REALISM HERO DISTINCT ELEMENTS ---
            if (charKey === 'yuehan') {
                // ===== YUEHAN - Divine Ice Mage 3D Model =====
                const deityRobeTex = createNeoChineseDeityRobeTexture();
                const robeMat = new THREE.MeshStandardMaterial({
                    map: deityRobeTex, roughness: 0.35, metalness: 0.15,
                    emissive: new THREE.Color(0x0055ff), emissiveIntensity: 0.12
                });
                const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.15, metalness: 0.9 });
                const iceAccentMat = new THREE.MeshStandardMaterial({
                    color: 0x00f0ff, emissive: new THREE.Color(0x00aeff),
                    emissiveIntensity: 0.7, roughness: 0.25, metalness: 0.6
                });
                const hairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
                const frostGlowMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 1.5 });
                const shaderGlow = new THREE.ShaderMaterial({
                    vertexShader: iceMageVertexShader, fragmentShader: iceMageFragmentShader,
                    uniforms: iceMageUniforms, transparent: true,
                    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                });

                // Override base body with robe-style
                while(playerGroup.children.length > 0) playerGroup.remove(playerGroup.children[0]);

                // Torso - Neo Blue cloud robe
                const yt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.14), robeMat);
                yt.position.y = 0.54; yt.castShadow = true; playerGroup.add(yt);
                // Sash
                const ys = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.15), goldMat);
                ys.position.y = 0.40; playerGroup.add(ys);
                // Skirt
                const ysk = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.14), robeMat);
                ysk.position.y = 0.24; playerGroup.add(ysk);
                // Side drapes
                const ydL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.12), iceAccentMat);
                ydL.position.set(-0.14, 0.22, 0); playerGroup.add(ydL);
                const ydR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.12), iceAccentMat);
                ydR.position.set(0.14, 0.22, 0); playerGroup.add(ydR);
                // Head
                const yh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat);
                yh.position.y = 0.84; playerGroup.add(yh);
                // White hair
                const yhTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), hairMat);
                yhTop.position.y = 0.97; playerGroup.add(yhTop);
                const yhBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.40, 0.06), hairMat);
                yhBack.position.set(0, 0.74, -0.11); playerGroup.add(yhBack);
                const yhSL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), hairMat);
                yhSL.position.set(-0.11, 0.78, 0.08); playerGroup.add(yhSL);
                const yhSR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), hairMat);
                yhSR.position.set(0.11, 0.78, 0.08); playerGroup.add(yhSR);
                // Frost tiara
                const ytiara = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.12), frostGlowMat);
                ytiara.position.set(0, 1.03, 0.02); playerGroup.add(ytiara);
                const ytwL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.06), goldMat);
                ytwL.position.set(-0.08, 1.08, -0.01); ytwL.rotation.z = 0.3; playerGroup.add(ytwL);
                const ytwR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.06), goldMat);
                ytwR.position.set(0.08, 1.08, -0.01); ytwR.rotation.z = -0.3; playerGroup.add(ytwR);
                // Sleeves
                const yaL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.18), robeMat);
                yaL.position.set(-0.24, 0.54, 0); playerGroup.add(yaL);
                const yaR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.18), robeMat);
                yaR.position.set(0.24, 0.54, 0); playerGroup.add(yaR);
                const ycL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.19), goldMat);
                ycL.position.set(-0.24, 0.38, 0); playerGroup.add(ycL);
                const ycR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.19), goldMat);
                ycR.position.set(0.24, 0.38, 0); playerGroup.add(ycR);
                // Legs
                const ylL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), robeMat);
                ylL.position.set(-0.06, 0.09, 0); playerGroup.add(ylL);
                const ylR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), robeMat);
                ylR.position.set(0.06, 0.09, 0); playerGroup.add(ylR);
                // Frost aura ring
                const yaura = new THREE.Mesh(
                    new THREE.RingGeometry(0.45, 0.55, 32),
                    new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
                );
                yaura.rotation.x = Math.PI / 2; yaura.position.y = 0.1; yaura.name = "halo"; playerGroup.add(yaura);
                // Ice stone weapon
                const stoneGroup = new THREE.Group();
                stoneGroup.name = "sword_blade";
                stoneGroup.position.set(0.38, 0.55, 0.15);
                const stoneCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), shaderGlow);
                stoneGroup.add(stoneCore);
                const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 24),
                    new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
                ring1.rotation.x = Math.PI / 3; stoneGroup.add(ring1);
                const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.015, 8, 24),
                    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
                ring2.rotation.y = Math.PI / 4; stoneGroup.add(ring2);
                playerGroup.add(stoneGroup);
                // Spinning Krong Chak (back wheel)
                const krongChak = new THREE.Group();
                krongChak.name = "spinning_back_wheel";
                krongChak.position.set(0, 0.55, -0.22);
                krongChak.add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 32),
                    new THREE.MeshStandardMaterial({ color: 0x00aeff, roughness: 0.2, metalness: 0.9 })));
                krongChak.add(new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.02, 8, 32),
                    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.1, metalness: 0.9 })));
                const starGeo = new THREE.BoxGeometry(0.6, 0.04, 0.06);
                const beam1 = new THREE.Mesh(starGeo, frostGlowMat); krongChak.add(beam1);
                const beam2 = new THREE.Mesh(starGeo, frostGlowMat); beam2.rotation.z = Math.PI / 3; krongChak.add(beam2);
                const beam3 = new THREE.Mesh(starGeo, frostGlowMat); beam3.rotation.z = -Math.PI / 3; krongChak.add(beam3);
                for (let i = 0; i < 8; i++) {
                    const sg = new THREE.Group();
                    const angle = (i / 8) * Math.PI * 2;
                    const spikeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), shaderGlow);
                    spikeMesh.position.y = 0.55; spikeMesh.rotation.y = Math.PI / 4; sg.add(spikeMesh);
                    const spikeBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), goldMat);
                    spikeBase.position.y = 0.44; sg.add(spikeBase);
                    sg.rotation.z = angle; krongChak.add(sg);
                }
                playerGroup.add(krongChak);
                // Orbiting ice shards
                heroIceMistClusters = [];
                for (let i = 0; i < 4; i++) {
                    const shard = new THREE.Group();
                    shard.name = `ice_shard_${i}`;
                    const shardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05),
                        new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.9 }));
                    shardMesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
                    shard.add(shardMesh);
                    scene.add(shard);
                    heroIceMistClusters.push(shard);
                }
            } else if (charKey === 'character2') {
                // ===== หลินเฟิง (เซียนกระบี่เหลี่ยม) - Voxel Sword Immortal 3D Model =====
                const lfSkinMat = new THREE.MeshStandardMaterial({ color: 0xffe0cc, roughness: 0.6 });
                const lfRobeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
                const lfAccentMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.7 });
                const lfDarkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
                const lfGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 });
                const lfCyanGlow = new THREE.ShaderMaterial({
                    vertexShader: linfengSwordVertexShader,
                    fragmentShader: linfengSwordFragmentShader,
                    uniforms: linfengSwordUniforms,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });

                // Override base body with robe-style
                while(playerGroup.children.length > 0) playerGroup.remove(playerGroup.children[0]);

                // Torso
                const lfTorso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.14), lfRobeMat);
                lfTorso.position.y = 0.54; lfTorso.castShadow = true; playerGroup.add(lfTorso);
                // Belt
                const lfBelt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.15), lfGoldMat);
                lfBelt.position.y = 0.40; playerGroup.add(lfBelt);
                // Skirt
                const lfSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.25, 0.14), lfRobeMat);
                lfSkirt.position.y = 0.25; playerGroup.add(lfSkirt);
                // Head
                const lfHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), lfSkinMat);
                lfHead.position.y = 0.84; playerGroup.add(lfHead);
                // Hair & TopKnot
                const lfHairTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), lfDarkMat);
                lfHairTop.position.y = 0.97; playerGroup.add(lfHairTop);
                const lfHairBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.30, 0.06), lfDarkMat);
                lfHairBack.position.set(0, 0.81, -0.11); playerGroup.add(lfHairBack);
                const lfTopKnot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), lfDarkMat);
                lfTopKnot.position.set(0, 1.04, -0.04); playerGroup.add(lfTopKnot);
                const lfHairPin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.02), lfGoldMat);
                lfHairPin.position.set(0, 1.05, -0.04); playerGroup.add(lfHairPin);
                // Arms
                const lfArmL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.18), lfRobeMat);
                lfArmL.position.set(-0.24, 0.54, 0); playerGroup.add(lfArmL);
                const lfArmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.18), lfRobeMat);
                lfArmR.position.set(0.24, 0.54, 0); playerGroup.add(lfArmR);
                // Legs
                const lfLegL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), lfRobeMat);
                lfLegL.position.set(-0.06, 0.09, 0); playerGroup.add(lfLegL);
                const lfLegR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), lfRobeMat);
                lfLegR.position.set(0.06, 0.09, 0); playerGroup.add(lfLegR);

                // Aura
                const lfAuraGeo = new THREE.CylinderGeometry(0.6, 0.5, 1.6, 16, 1, true);
                const lfAuraMat = new THREE.MeshBasicMaterial({
                    color: 0x67e8f9, transparent: true, opacity: 0.3,
                    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, wireframe: true
                });
                const lfAura = new THREE.Mesh(lfAuraGeo, lfAuraMat);
                lfAura.position.y = 0.5; lfAura.name = "playerAura"; playerGroup.add(lfAura);

                // Main Sword (must stay named "sword_blade" for shared attack animations)
                const lfSwordGroup = new THREE.Group();
                lfSwordGroup.name = "sword_blade";
                lfSwordGroup.position.set(0.32, 0.36, 0.2);
                lfSwordGroup.rotation.set(-0.5, 0.1, -0.4);
                const lfBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.02), lfCyanGlow);
                lfBlade.position.y = 0.6; lfBlade.castShadow = true; lfSwordGroup.add(lfBlade);
                const lfGuard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.06), lfGoldMat);
                lfGuard.position.y = 0.1; lfSwordGroup.add(lfGuard);
                const lfHilt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), lfDarkMat);
                lfHilt.position.y = -0.03; lfSwordGroup.add(lfHilt);
                playerGroup.add(lfSwordGroup);

                // Floating Swords (3 orbiting blades - "ประสานกระบี่เทวะสามเล่ม" perk visual)
                heroFloatingSwords = [];
                for (let i = 0; i < 3; i++) {
                    const fsGroup = new THREE.Group();
                    const fsBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.02), lfCyanGlow);
                    fsBlade.position.y = 0.4; fsGroup.add(fsBlade);
                    const fsGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), lfGoldMat);
                    fsGuard.position.y = 0.03; fsGroup.add(fsGuard);
                    scene.add(fsGroup);
                    heroFloatingSwords.push(fsGroup);
                }
            } else if (charKey === 'character3') {
                // ===== เหลย เจิ้น (เทพจอมสายฟ้า) - Speed/Lightning Deity 3D Model =====
                const rjSkinMat = new THREE.MeshStandardMaterial({ color: 0xfff0e6, roughness: 0.6 });
                const rjRobeTex = createRaijinLightningRobeTexture();
                const rjRobeMat = new THREE.MeshStandardMaterial({
                    map: rjRobeTex, roughness: 0.35, metalness: 0.2,
                    emissive: new THREE.Color(0xb45309), emissiveIntensity: 0.15
                });
                const rjGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.15, metalness: 0.95 });
                const rjLightningAccentMat = new THREE.MeshStandardMaterial({
                    color: 0xfef08a, emissive: new THREE.Color(0xfacc15),
                    emissiveIntensity: 1.0, roughness: 0.2, metalness: 0.8
                });
                const rjHairMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.7 });
                const rjLightningCoreMat = new THREE.MeshStandardMaterial({ color: 0xfff59d, emissive: 0xfacc15, emissiveIntensity: 1.5 });
                const rjShaderGlow = new THREE.ShaderMaterial({
                    vertexShader: raijinVertexShader,
                    fragmentShader: raijinFragmentShader,
                    uniforms: raijinSpearUniforms,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });

                // Override base body with own model
                while(playerGroup.children.length > 0) playerGroup.remove(playerGroup.children[0]);

                // Torso
                const rjTorso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.14), rjRobeMat);
                rjTorso.position.y = 0.54; rjTorso.castShadow = true; playerGroup.add(rjTorso);
                // Sash
                const rjSash = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.15), rjGoldMat);
                rjSash.position.y = 0.40; playerGroup.add(rjSash);
                // Robe skirt
                const rjSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.14), rjRobeMat);
                rjSkirt.position.y = 0.24; playerGroup.add(rjSkirt);
                // Side drapes
                const rjDrapeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.12), rjLightningAccentMat);
                rjDrapeL.position.set(-0.14, 0.22, 0); playerGroup.add(rjDrapeL);
                const rjDrapeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 0.12), rjLightningAccentMat);
                rjDrapeR.position.set(0.14, 0.22, 0); playerGroup.add(rjDrapeR);
                // Head
                const rjHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), rjSkinMat);
                rjHead.position.y = 0.84; playerGroup.add(rjHead);
                // Flowing hair
                const rjHairTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), rjHairMat);
                rjHairTop.position.y = 0.97; playerGroup.add(rjHairTop);
                const rjHairBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.06), rjHairMat);
                rjHairBack.position.set(0, 0.72, -0.12); playerGroup.add(rjHairBack);
                // Crown of Lightning (Tiara)
                const rjTiara = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.12), rjLightningCoreMat);
                rjTiara.position.set(0, 1.03, 0.02); playerGroup.add(rjTiara);
                const rjTiaraWingL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.06), rjGoldMat);
                rjTiaraWingL.position.set(-0.08, 1.08, -0.01); rjTiaraWingL.rotation.z = 0.4; playerGroup.add(rjTiaraWingL);
                const rjTiaraWingR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.06), rjGoldMat);
                rjTiaraWingR.position.set(0.08, 1.08, -0.01); rjTiaraWingR.rotation.z = -0.4; playerGroup.add(rjTiaraWingR);
                // Sleeves
                const rjArmL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.18), rjRobeMat);
                rjArmL.position.set(-0.24, 0.54, 0); playerGroup.add(rjArmL);
                const rjArmR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.18), rjRobeMat);
                rjArmR.position.set(0.24, 0.54, 0); playerGroup.add(rjArmR);
                const rjCuffL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.19), rjGoldMat);
                rjCuffL.position.set(-0.24, 0.38, 0); playerGroup.add(rjCuffL);
                const rjCuffR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.19), rjGoldMat);
                rjCuffR.position.set(0.24, 0.38, 0); playerGroup.add(rjCuffR);
                // Legs
                const rjLegL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), rjRobeMat);
                rjLegL.position.set(-0.06, 0.09, 0); playerGroup.add(rjLegL);
                const rjLegR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), rjRobeMat);
                rjLegR.position.set(0.06, 0.09, 0); playerGroup.add(rjLegR);

                // Ring Aura
                const rjAuraGeo = new THREE.RingGeometry(0.45, 0.55, 32);
                const rjAuraMat = new THREE.MeshBasicMaterial({
                    color: 0xfacc15, transparent: true, opacity: 0.85,
                    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                });
                const rjAura = new THREE.Mesh(rjAuraGeo, rjAuraMat);
                rjAura.rotation.x = Math.PI / 2; rjAura.position.y = 0.1;
                rjAura.name = "playerAura"; playerGroup.add(rjAura);

                // Primary weapon: Long Lightning Spear
                const rjSpearGroup = new THREE.Group();
                rjSpearGroup.name = "lightning_spear_weapon";
                const rjStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), rjRobeMat);
                rjStaff.rotation.x = Math.PI / 2; rjSpearGroup.add(rjStaff);
                const rjGuard1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), rjGoldMat);
                rjGuard1.position.z = 0.5; rjSpearGroup.add(rjGuard1);
                const rjGuard2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), rjGoldMat);
                rjGuard2.position.z = 0.5; rjSpearGroup.add(rjGuard2);
                const rjSpearhead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), rjShaderGlow);
                rjSpearhead.position.z = 0.75; rjSpearhead.rotation.x = Math.PI / 2; rjSpearGroup.add(rjSpearhead);
                const rjSpearbutt = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), rjGoldMat);
                rjSpearbutt.position.z = -0.75; rjSpearbutt.rotation.x = -Math.PI / 2; rjSpearGroup.add(rjSpearbutt);
                rjSpearGroup.position.set(0.32, 0.55, 0.15);
                rjSpearGroup.rotation.set(0.6, 0.2, -0.4);
                playerGroup.add(rjSpearGroup);

                // Back accessory: Raijin Lightning Halo (auto-spun by game.js's generic "spinning_back_wheel" logic)
                const rjHalo = new THREE.Group();
                rjHalo.name = "spinning_back_wheel";
                rjHalo.position.set(0, 0.55, -0.22);
                const rjHaloRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 32), rjGoldMat);
                rjHalo.add(rjHaloRing);
                const rjSpikeCount = 6;
                for (let i = 0; i < rjSpikeCount; i++) {
                    const rjSpGroup = new THREE.Group();
                    const rjAngle = (i / rjSpikeCount) * Math.PI * 2;
                    const rjDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), rjRobeMat);
                    rjDrum.position.y = 0.42; rjDrum.rotation.x = Math.PI / 2; rjSpGroup.add(rjDrum);
                    const rjDrumGold1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), rjGoldMat);
                    rjDrumGold1.position.set(0, 0.42, 0.06); rjDrumGold1.rotation.x = Math.PI / 2; rjSpGroup.add(rjDrumGold1);
                    const rjDrumGold2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), rjGoldMat);
                    rjDrumGold2.position.set(0, 0.42, -0.06); rjDrumGold2.rotation.x = Math.PI / 2; rjSpGroup.add(rjDrumGold2);
                    const rjCrystalSpike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), rjShaderGlow);
                    rjCrystalSpike.position.y = 0.52; rjSpGroup.add(rjCrystalSpike);
                    rjSpGroup.rotation.z = rjAngle;
                    rjHalo.add(rjSpGroup);
                }
                playerGroup.add(rjHalo);

                // Orbiting lightning shards (auto-animated by game.js's generic heroIceMistClusters logic)
                heroIceMistClusters = [];
                for (let i = 0; i < 4; i++) {
                    const rjShard = new THREE.Group();
                    rjShard.name = `ice_shard_${i}`;
                    const rjShardMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.05, 0.25, 0.05),
                        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.9 })
                    );
                    rjShardMesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
                    rjShard.add(rjShardMesh);
                    scene.add(rjShard);
                    heroIceMistClusters.push(rjShard);
                }
            } else {
                // ===== ตัวละครลับถัดไป (character4+) =====
                // ยังไม่มีโมเดล 3D เฉพาะตัว — ตอนนี้ใช้ร่างมนุษย์พื้นฐาน (torso/head/arms/legs
                // ที่สร้างไว้ด้านบนของฟังก์ชันนี้) ไปพลางๆ ก่อน
                // เมื่อได้โค้ดโมเดลจริงมา ให้เพิ่ม else if (charKey === 'characterX') { ... }
                // ไว้ก่อนบรรทัด "} else {" นี้ (เหมือนแพทเทิร์นของ yuehan / character2 / character3 ด้านบน)
            }
        }



        // ===== ข้อมูลแมพ (ย้ายมาจากหน้าล็อกอิน/สมัครสมาชิก) =====
        // ใช้แสดงในการ์ดเลือกแมพบนหน้าเลือกฮีโร่
        // TODO: map2/map3 ยังไม่ได้กำหนดฉาก 3D — แก้ title/name/desc/icon/theme
        // ของ map2/map3 ตรงนี้เมื่อสร้างแมพใหม่เพิ่ม (icon ใช้ชื่อคลาส Font Awesome,
        // theme ใช้สีของ Tailwind เช่น cyan/rose/amber/emerald ฯลฯ)
        const MAP_INFO = {
            map1: { title: "❄️ ทะเลทรายน้ำแข็งอาถรรพ์", name: "แมพที่ 1", desc: "ทะเลทรายน้ำแข็งอาถรรพ์", icon: "fa-snowflake", theme: "cyan" },
            map2: { title: "⚡ วิหารสายฟ้าทองสวรรค์", name: "แมพที่ 2", desc: "วิหารสายฟ้าทองสวรรค์", icon: "fa-bolt", theme: "amber" },
            map3: { title: "🗺️ แมพที่ 3 (รอเพิ่มข้อมูล)", name: "แมพที่ 3", desc: "ยังไม่ได้กำหนดแมพ", icon: "fa-map", theme: "amber" }
        };

        // วาดการ์ดเลือกแมพในหน้าเลือกฮีโร่ (ข้างๆ การ์ดตัวละคร)
        function renderMapSelector() {
            const container = document.getElementById("mapCardContainer");
            if (!container) return;
            container.innerHTML = "";

            const currentMap = gameState.user.selectedMap || "map1";

            Object.keys(MAP_INFO).forEach(mapKey => {
                const map = MAP_INFO[mapKey];
                const isSelected = currentMap === mapKey;

                // Uniform horizontal card: icon left, text right, checkmark only when selected.
                // Same shape whether selected or not, so the eye doesn't have to parse 2 layouts.
                const cardHtml = `
                <div onclick="selectMap('${mapKey}')" class="cursor-pointer flex items-center gap-3 bg-slate-900/60 rounded-2xl border-2 ${isSelected ? 'border-' + map.theme + '-500 bg-' + map.theme + '-950/10' : 'border-slate-800 hover:border-cyan-500/40'} p-3.5 transition-all duration-200">
                    <div class="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border ${isSelected ? 'border-' + map.theme + '-400 bg-' + map.theme + '-500/10 text-' + map.theme + '-400' : 'border-slate-800 bg-slate-950/60 text-slate-500'} transition">
                        <i class="fa-solid ${map.icon} text-sm"></i>
                    </div>
                    <div class="text-left flex-1 min-w-0">
                        <span class="text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-' + map.theme + '-400' : 'text-slate-500'}">${map.name}</span>
                        <p class="text-[11px] font-bold text-white leading-tight truncate">${map.desc}</p>
                    </div>
                    <i class="fa-solid fa-circle-check text-${map.theme}-400 text-base flex-shrink-0 ${isSelected ? '' : 'opacity-0'}"></i>
                </div>`;

                container.insertAdjacentHTML("beforeend", cardHtml);
            });
        }

        // เลือกแมพสนามรบ (บันทึกลงบัญชีทันที ไม่ต้องรอกดยืนยัน)
        function selectMap(mapKey) {
            if (!MAP_INFO[mapKey]) return;
            playSynthSound('click');

            gameState.user.selectedMap = mapKey;
            gameState.user.title = MAP_INFO[mapKey].title;

            renderMapSelector();
            persistCurrentUserProgress();
        }

        function renderCharacterRoster() {
            const container = document.getElementById("characterCardContainer");
            container.innerHTML = "";

            renderMapSelector();

            const totalCleared = gameState.user.clearedSubStages.length;

            Object.keys(CHARACTERS).forEach(charKey => {
                const char = CHARACTERS[charKey];
                const isLocked = totalCleared < char.unlockedAt;
                
                // ทุกการ์ด (ล็อก/ยังไม่มา/เลือกได้) ใช้โครงเดียวกันเป๊ะ: อวตาร -> ชื่อ -> สถานะ -> กล่องท้าย
                // เพื่อให้ความสูงเท่ากันหมดและตาไม่ต้องปรับตามการ์ดที่ต่างโครงสร้างกัน
                let cardHtml = "";
                if (char.comingSoon || isLocked) {
                    const isComingSoon = !!char.comingSoon;
                    const statusText = isComingSoon
                        ? "🚧 กำลังพัฒนา — เร็วๆ นี้"
                        : `🔒 ผ่านด่านอีก ${char.unlockedAt - totalCleared} ด่านเพื่อปลดล็อก`;
                    const iconClass = isComingSoon ? "fa-person-circle-question" : "fa-lock";

                    cardHtml = `
                    <div class="flex flex-col bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 p-5 opacity-50 select-none text-center h-full min-h-[220px]">
                        <div class="w-14 h-14 mx-auto bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-800">
                            <i class="fa-solid ${iconClass} text-slate-600 text-lg"></i>
                        </div>
                        <h3 class="text-sm font-bold text-slate-500 mt-3">${char.name}</h3>
                        <p class="text-[10px] mt-1.5 font-bold uppercase tracking-wider ${isComingSoon ? 'text-amber-400' : 'text-rose-400'}">${statusText}</p>
                        <div class="mt-auto pt-3 border-t border-white/5">
                            <span class="text-[9px] text-slate-600 block uppercase font-bold tracking-widest">สกิล: ???</span>
                        </div>
                    </div>`;
                } else {
                    const isSelected = gameState.user.selectedCharacter === charKey;
                    cardHtml = `
                    <div id="charCard-${charKey}" onclick="selectCharacter('${charKey}')" class="cursor-pointer flex flex-col bg-slate-900/60 rounded-2xl border-2 ${isSelected ? 'border-' + char.themeColor + '-500 bg-' + char.themeColor + '-950/10' : 'border-slate-800 hover:border-cyan-500/40'} p-5 transition-all duration-200 text-center h-full min-h-[220px]">
                        <div class="flex items-center justify-center gap-2">
                            <div class="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border ${isSelected ? 'border-' + char.themeColor + '-400' : 'border-slate-800'} transition">
                                <i class="fa-solid fa-user-shield text-lg"></i>
                            </div>
                        </div>
                        ${isSelected ? `<span class="inline-block mx-auto mt-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">✓ กำลังใช้งาน</span>` : ''}
                        <h3 class="text-sm font-bold text-white mt-2">${char.name}</h3>
                        <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${char.role}</p>
                        <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">${char.desc}</p>
                        <div class="mt-auto pt-2.5 border-t border-white/5 bg-slate-950/50 p-2.5 rounded-xl text-left">
                            <span class="text-[10px] text-amber-400 block font-bold uppercase tracking-wider">${char.perkTitle}</span>
                            <span class="text-[10px] text-slate-300 block mt-1 leading-normal">${char.perkDesc}</span>
                        </div>
                    </div>`;
                }

                container.insertAdjacentHTML("beforeend", cardHtml);
            });
        }

        // ตรวจสอบว่าด่านที่เพิ่งผ่านทำให้มีฮีโร่ตัวใหม่ "ข้ามผ่านเกณฑ์ปลดล็อก" หรือไม่
        // เทียบจำนวนด่านที่ผ่านก่อน/หลัง แล้วหาฮีโร่ที่ unlockedAt อยู่ในช่วงนั้นพอดี
        function checkCharacterUnlocks(clearedCountBefore, clearedCountAfter) {
            if (clearedCountAfter <= clearedCountBefore) return;

            const newlyUnlocked = Object.keys(CHARACTERS)
                .map(key => CHARACTERS[key])
                .filter(char => !char.comingSoon
                    && char.unlockedAt > clearedCountBefore
                    && char.unlockedAt <= clearedCountAfter);

            if (newlyUnlocked.length === 0) return;

            // โชว์ทีละใบ ห่างกันเล็กน้อยเผื่อปลดล็อกพร้อมกันหลายตัว
            newlyUnlocked.forEach((char, idx) => {
                setTimeout(() => showCharacterUnlockToast(char), idx * 4200);
            });
        }

        // แจ้งเตือนป๊อปอัปมุมบนเมื่อปลดล็อกฮีโร่ใหม่
        function showCharacterUnlockToast(char) {
            const toast = document.getElementById("toastCharUnlock");
            const nameEl = document.getElementById("toastCharUnlockName");
            const roleEl = document.getElementById("toastCharUnlockRole");
            if (!toast || !nameEl) return;

            playSynthSound('victory');

            nameEl.textContent = char.name;
            if (roleEl) roleEl.textContent = char.role;

            toast.classList.remove("hidden", "toast-unlock-hide");
            // force reflow เพื่อให้ animation เล่นใหม่ทุกครั้งแม้จะโชว์ติดกัน
            void toast.offsetWidth;
            toast.classList.add("toast-unlock-show");

            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => {
                toast.classList.remove("toast-unlock-show");
                toast.classList.add("toast-unlock-hide");
                setTimeout(() => toast.classList.add("hidden"), 350);
            }, 3800);
        }

        function selectCharacter(charKey) {
            playSynthSound('click');
            gameState.user.selectedCharacter = charKey;
            
            renderCharacterRoster();

            const confirmBtn = document.getElementById("confirmCharBtn");
            confirmBtn.className = "w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 hover:brightness-110 text-white font-bold text-xs cursor-pointer rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider";
            confirmBtn.disabled = false;
        }

        // เปิดหน้าจอเลือกฮีโร่ใหม่อีกครั้งหลัง login (เช่น กดปุ่ม "เปลี่ยนฮีโร่")
        // สำคัญ: ต้องเรียก renderCharacterRoster() ใหม่ทุกครั้งที่เปิดหน้านี้
        // เพราะสถานะปลดล็อกอ้างอิงจาก gameState.user.clearedSubStages ที่อาจเปลี่ยนไปแล้ว
        // ระหว่างเล่น (เคลียร์ด่านเพิ่ม) แต่หน้าจอนี้ไม่ได้ re-render อัตโนมัติ
        function openCharacterSelect() {
            playSynthSound('click');
            document.getElementById("screenCategorySelect").classList.add("hidden");
            document.getElementById("screenSubStageSelect").classList.add("hidden");
            document.getElementById("screenBattle").classList.add("hidden");
            document.getElementById("screenCharSelect").classList.remove("hidden");

            renderCharacterRoster();

            // ปุ่มยืนยันต้องกดได้เลยเพราะมีฮีโร่ที่เลือกอยู่แล้ว
            const confirmBtn = document.getElementById("confirmCharBtn");
            if (confirmBtn && gameState.user.selectedCharacter) {
                confirmBtn.className = "w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 hover:brightness-110 text-white font-bold text-xs cursor-pointer rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider";
                confirmBtn.disabled = false;
            }
        }



// ===== Character perks & header XP (moved from game.js) =====
        function updateHeaderXp() {
            const neededXp = 100;
            if (gameState.user.xp >= neededXp) {
                gameState.user.xp -= neededXp;
                gameState.user.level++;
                playSynthSound('victory');
            }
            
            const xpBar = document.getElementById("headerXpBar");
            if (xpBar) {
                const xpPercent = Math.min(100, Math.max(0, (gameState.user.xp / neededXp) * 100));
                xpBar.style.width = `${xpPercent}%`;
            }
            
            const levelBadge = document.getElementById("headerLevelBadge");
            if (levelBadge) {
                levelBadge.textContent = `LV.${gameState.user.level}`;
            }
        }

        function useCharacterHint() {
            if (gameState.hintCount >= 1) return;
            
            const currentQ = gameState.currentQuestionPool[gameState.currentQuestionIndex];
            const incorrectIndexes = [];
            currentQ.choices.forEach((c, idx) => {
                if (idx !== currentQ.answer) {
                    incorrectIndexes.push(idx);
                }
            });

            const randomIncorrect = incorrectIndexes[Math.floor(Math.random() * incorrectIndexes.length)];
            const buttons = document.querySelectorAll(".choice-btn");
            
            if (buttons[randomIncorrect]) {
                playSynthSound('hint');
                buttons[randomIncorrect].style.opacity = "0.3";
                buttons[randomIncorrect].disabled = true;
                buttons[randomIncorrect].style.pointerEvents = "none";
                const textSpan = buttons[randomIncorrect].querySelector(".choice-text");
                if (textSpan) textSpan.innerHTML = `<span class="line-through text-slate-600 font-normal">แนะแนวจำกัดชอยส์ทิ้ง ❌</span>`;
            }

            gameState.hintCount++;
            const hintBtn = document.getElementById("perkHintBtn");
            hintBtn.disabled = true;
            hintBtn.className = "bg-slate-950/80 text-slate-600 border border-white/5 text-[10px] font-bold px-4 py-1.5 rounded-xl cursor-not-allowed uppercase tracking-wider";
            hintBtn.textContent = "วิเคราะห์สำเร็จ 👁️";
        }

        function triggerResurrection() {
            playSynthSound('hint');
            gameState.isResurrectionAvailable = false;
            gameState.playerHp = 30; // Revives back with 30 HP
            updateHpBars();

            const ankhIcon = document.getElementById("hudAnkhIcon");
            if (ankhIcon) ankhIcon.classList.add("hidden");

            document.getElementById("combatLogText").innerHTML = `💖 <span class="text-rose-400 font-extrabold">คุณสมบัติคืนชีพ Aurora ปลดทำงาน!</span> กู้ HP กลับขึ้นมา 30%`;
            
            const overlay = document.getElementById("flashOverlay");
            overlay.className = "absolute inset-0 bg-rose-500/20 pointer-events-none transition-all duration-500 z-10";
            setTimeout(() => {
                overlay.className = "absolute inset-0 bg-red-600/0 pointer-events-none transition-all duration-300 z-10";
            }, 600);

            setTimeout(() => {
                gameState.currentQuestionIndex++;
                renderQuestion();
            }, 1000);
        }