// maze-game.js
document.addEventListener('DOMContentLoaded', function() {
    // 게임이 시작될 준비가 되었는지 확인
    if (!document.getElementById('maze-game')) {
        console.error('게임 캔버스를 찾을 수 없습니다!');
        return;
    }
    
    // 여기서부터 게임 코드가 시작됩니다
    initGame();
});

// 게임 초기화 함수
function initGame() {
    // 게임 관련 변수 선언
    let scene, camera, renderer;
    let plane, ball, walls = [], goal;
    let moveSpeed = 0.01;
    let isGameActive = true;
    let timer = 0;
    let timerInterval;
    
    // 씬, 카메라, 렌더러 설정
    setupScene();
    
    // 게임 요소 생성
    createGameElements();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 애니메이션 루프 시작
    animate();
    
    // 씬, 카메라, 렌더러를 설정하는 함수
    function setupScene() {
        // 게임 캔버스 가져오기
        const canvas = document.getElementById('maze-game');
        const container = document.getElementById('game-container');
        
        // 씬 생성
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // 하늘색 배경
        
        // 카메라 설정
        camera = new THREE.PerspectiveCamera(
            75, // 시야각
            container.clientWidth / container.clientHeight, // 화면 비율
            0.1, // 가까운 클리핑 평면
            1000 // 먼 클리핑 평면
        );
        // 카메라 설정 수정
        camera.position.set(0, 7, 7); 
        camera.lookAt(0, 0, 0); // 카메라가 바라보는 지점
        
        // 렌더러 설정
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true // 부드러운 렌더링
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);
        
        // 창 크기 변경 시 대응
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
        
        console.log('씬 설정 완료');
    }
    
    // 게임 요소(미로, 공, 골인 지점) 생성 함수
    function createGameElements() {
        // 기본 재질 설정
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x44aa88,
            roughness: 0.5
        });
        
        // 바닥 평면 생성
        const planeGeometry = new THREE.BoxGeometry(10, 0.2, 10); // 두께 감소
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = -0.1; // 위치 조정
        scene.add(plane);
        
        // 공 생성
        const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            metalness: 0.3,
            roughness: 0.2
        });
        ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(-4, 0.2, -4); // y 위치 조정
        ball.castShadow = true;
        scene.add(ball);
        
        // 벽 생성
        createWalls();
        
        // 골인 지점 생성
        const goalGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            roughness: 0.3,
            metalness: 0.2
        });
        goal = new THREE.Mesh(goalGeometry, goalMaterial);
        goal.position.set(4, 0.1, 4); // y 위치 조정
        scene.add(goal);
        
        // 타이머 시작
        startTimer();
        
        console.log('게임 요소 생성 완료');
    }
    
    // 벽 만들기 함수
    function createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8844aa,
            roughness: 0.7
        });
        
        // 미로 벽 배치 (간단한 예시)
        // 가로 벽
        createWall(-2, 0, 2, 4, 0.5, wallMaterial);
        createWall(2, 0, -2, 4, 0.5, wallMaterial);
        
        // 세로 벽
        createWall(0, 0, 0, 0.5, 4, wallMaterial);
        createWall(-3, 0, -2, 0.5, 2, wallMaterial);
        createWall(3, 0, 2, 0.5, 2, wallMaterial);
    }
    
    // 벽 생성 헬퍼 함수
    function createWall(x, y, z, width, depth, material) {
        const wallGeometry = new THREE.BoxGeometry(width, 1, depth);
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x, y + 0.5, z); // y+0.5로 바닥 위에 위치
        scene.add(wall);
        walls.push(wall); // 벽 배열에 추가하여 충돌 감지에 사용
    }
    
    // 타이머 시작 함수
    function startTimer() {
        timer = 0;
        document.getElementById('timer').textContent = timer;
        
        timerInterval = setInterval(() => {
            timer++;
            document.getElementById('timer').textContent = timer;
        }, 1000);
    }
    
    // 이벤트 리스너 설정 함수
    function setupEventListeners() {
        const gameContainer = document.getElementById('game-container');
        gameContainer.focus();
        
        // 키보드 이벤트를 window에 연결 (전역으로 처리)
        window.addEventListener('keydown', (event) => {
            // console.log를 추가하여 키 입력을 확인
            console.log('Key pressed:', event.key);
            
            if (!isGameActive && event.key.toLowerCase() === 'r') {
                console.log('재시작 시도 중...');
                resetGame();
                return;
            }
            
            if (!isGameActive) return;
            
            switch(event.key) {
                case 'ArrowUp':
                    plane.rotation.x = Math.max(plane.rotation.x - moveSpeed, -0.3);
                    break;
                case 'ArrowDown':
                    plane.rotation.x = Math.min(plane.rotation.x + moveSpeed, 0.3);
                    break;
                case 'ArrowLeft':
                    plane.rotation.z = Math.max(plane.rotation.z - moveSpeed, -0.3);
                    break;
                case 'ArrowRight':
                    plane.rotation.z = Math.min(plane.rotation.z + moveSpeed, 0.3);
                    break;
            }
        });
        
        // 키 떼면 원위치로 서서히 돌아오게
        document.addEventListener('keyup', (event) => {
            if (!isGameActive) return;
            
            if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                // x축 회전 감소
                plane.rotation.x *= 0.9;
            } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                // z축 회전 감소
                plane.rotation.z *= 0.9;
            }
        });
        
        // 마우스 이벤트 변수
        let isMouseDown = false;
        let mouseStartPosition = { x: 0, y: 0 };

        // 마우스 이벤트: 드래그로 판 기울이기
        gameContainer.addEventListener('mousedown', (event) => {
            if (!isGameActive) return;
            
            isMouseDown = true;
            mouseStartPosition = {
                x: event.clientX,
                y: event.clientY
            };
            
            // 기본 드래그 동작 방지
            event.preventDefault();
        });

        document.addEventListener('mousemove', (event) => {
            if (!isGameActive || !isMouseDown) return;
            
            // 마우스 이동 거리 계산
            const deltaX = event.clientX - mouseStartPosition.x;
            const deltaY = event.clientY - mouseStartPosition.y;
            
            // 이동 거리에 따라 판 기울이기 (민감도 조절)
            const sensitivity = 0.0005;
            plane.rotation.z = -deltaX * sensitivity;
            plane.rotation.x = -deltaY * sensitivity;
            
            // 기울기 제한
            plane.rotation.z = Math.max(Math.min(plane.rotation.z, 0.3), -0.3);
            plane.rotation.x = Math.max(Math.min(plane.rotation.x, 0.3), -0.3);
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // 터치 이벤트도 추가 (모바일 지원)
        gameContainer.addEventListener('touchstart', (event) => {
            if (!isGameActive) return;
            
            isMouseDown = true;
            mouseStartPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            
            // 기본 스크롤 동작 방지
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (event) => {
            if (!isGameActive || !isMouseDown) return;
            
            // 터치 이동 거리 계산
            const deltaX = event.touches[0].clientX - mouseStartPosition.x;
            const deltaY = event.touches[0].clientY - mouseStartPosition.y;
            
            // 이동 거리에 따라 판 기울이기 (민감도 조절)
            const sensitivity = 0.0005;
            plane.rotation.z = -deltaX * sensitivity;
            plane.rotation.x = -deltaY * sensitivity;
            
            // 기울기 제한
            plane.rotation.z = Math.max(Math.min(plane.rotation.z, 0.3), -0.3);
            plane.rotation.x = Math.max(Math.min(plane.rotation.x, 0.3), -0.3);
            
            // 기본 스크롤 동작 방지
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            isMouseDown = false;
        });

        console.log('이벤트 리스너 설정 완료');
    }

    // 게임 리셋 함수
    function resetGame() {
        console.log('게임 재시작!');
        
        // 공 위치 초기화
        ball.position.set(-4, 0.3, -4);
        
        // 공 속도 초기화
        ball.userData.velocityX = 0;
        ball.userData.velocityZ = 0;
        
        // 판 회전 초기화
        plane.rotation.x = 0;
        plane.rotation.z = 0;
        
        // 게임 상태 초기화
        isGameActive = true;
        
        // 안내 메시지 초기화
        const instructions = document.getElementById('game-instructions');
        if (instructions) {
            instructions.textContent = '방향키 또는 마우스로 판을 기울여 공을 굴리세요!';
            instructions.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        }
        
        // 이전에 생성된 재시작 버튼 제거
        const existingButton = document.querySelector('#game-container button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // 타이머 재시작
        clearInterval(timerInterval);
        startTimer();
        
        // 게임 컨테이너에 다시 포커스
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.focus();
        }
    }
    
    function handleWin() {
        isGameActive = false;
        clearInterval(timerInterval);
        
        // 승리 메시지 표시
        const instructions = document.getElementById('game-instructions');
        instructions.textContent = `축하합니다! ${timer}초만에 클리어했습니다. R키를 눌러 재시작하세요.`;
        instructions.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
        
        // 보다 뚜렷한 재시작 안내를 위해 추가 버튼 생성
        const restartButton = document.createElement('button');
        restartButton.textContent = '재시작';
        restartButton.className = 'absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded';
        restartButton.onclick = resetGame;
        document.getElementById('game-container').appendChild(restartButton);
    }
    
    // 공 움직임 업데이트 함수
    function updateBall() {
        if (!isGameActive) return;

        // 기울기에 따른 공 이동 (간단한 물리 시뮬레이션)
        const gravity = 0.01;
        const friction = 0.98;
        
        // 현재 속도 계산 (기울기에 비례) - 방향 수정
        ball.userData.velocityX = (ball.userData.velocityX || 0) - plane.rotation.z * gravity;
        ball.userData.velocityZ = (ball.userData.velocityZ || 0) + plane.rotation.x * gravity;
        
        // 마찰력 적용
        ball.userData.velocityX *= friction;
        ball.userData.velocityZ *= friction;
        
        // 속도 적용하여 공 이동 (x, z 평면으로만 이동)
        ball.position.x += ball.userData.velocityX;
        ball.position.z += ball.userData.velocityZ;
        
        // 중요: 공의 y 위치를 바닥에 고정
        const ballRadius = 0.3; // 공의 반지름
        // 바닥 평면 상의 공 위치에서의 y 좌표 계산
        const planeY = getPlaneYAtPoint(ball.position.x, ball.position.z);
        // 공의 y 위치를 바닥 위 반지름 높이로 설정
        ball.position.y = planeY + ballRadius;
        
        // 바닥 경계 충돌 체크
        const boundaryLimit = 4.7;
        if (Math.abs(ball.position.x) > boundaryLimit) {
            ball.position.x = Math.sign(ball.position.x) * boundaryLimit;
            ball.userData.velocityX *= -0.5; // 반대 방향으로 튕김 (에너지 손실)
        }
        if (Math.abs(ball.position.z) > boundaryLimit) {
            ball.position.z = Math.sign(ball.position.z) * boundaryLimit;
            ball.userData.velocityZ *= -0.5; // 반대 방향으로 튕김 (에너지 손실)
        }
        
        // 벽과의 충돌 감지
        walls.forEach(wall => {
            // 간단한 충돌 감지 (실제로는 더 복잡한 충돌 감지가 필요함)
            const ballBox = new THREE.Box3().setFromObject(ball);
            const wallBox = new THREE.Box3().setFromObject(wall);
            
            if (ballBox.intersectsBox(wallBox)) {
                // 충돌 시 속도 반전 및 감소
                ball.userData.velocityX *= -0.8;
                ball.userData.velocityZ *= -0.8;
                
                // 충돌 후 약간 위치 조정 (관통 방지)
                const pushDistance = 0.1;
                const xDiff = ball.position.x - wall.position.x;
                const zDiff = ball.position.z - wall.position.z;
                
                if (Math.abs(xDiff) > Math.abs(zDiff)) {
                    ball.position.x += Math.sign(xDiff) * pushDistance;
                } else {
                    ball.position.z += Math.sign(zDiff) * pushDistance;
                }
            }
        });
        
        // 골인 지점 충돌 감지
        const ballToGoal = new THREE.Vector2(
            ball.position.x - goal.position.x,
            ball.position.z - goal.position.z
        );
        
        if (ballToGoal.length() < 0.6) {
            console.log('골인!');
            handleWin();
        }
    }
    
    // 바닥 평면 상의 특정 지점 (x, z)에서의 y 좌표를 계산하는 함수
    function getPlaneYAtPoint(x, z) {
        // 평면의 법선 벡터
        const normal = new THREE.Vector3(plane.rotation.z, 1, -plane.rotation.x).normalize();
        
        // 평면 중심에서의 높이 (평면의 y 위치)
        const planeCenter = plane.position.y;
        
        // 평면 상의 점 (x, ?, z)의 y 좌표 계산
        // 평면 방정식: normal.x * x + normal.y * y + normal.z * z + d = 0
        // 여기서 d = -(normal.x * center.x + normal.y * center.y + normal.z * center.z)
        const d = -(normal.x * 0 + normal.y * planeCenter + normal.z * 0);
        
        // y 좌표 계산: y = -(normal.x * x + normal.z * z + d) / normal.y
        return -(normal.x * x + normal.z * z + d) / normal.y;
    }

    // 골인 지점도 바닥 위에 고정하기
    function updateGoalPosition() {
        const goalX = 4;
        const goalZ = 4;
        const goalHeight = 0.05; // 골인 지점 높이 (반지름)
        
        // 바닥 평면 상의 골인 지점 위치에서의 y 좌표 계산
        const planeY = getPlaneYAtPoint(goalX, goalZ);
        
        // 골인 지점의 y 위치를 바닥 위로 설정
        goal.position.y = planeY + goalHeight;
    }

    function animate() {
        requestAnimationFrame(animate);
        
        // 공 위치 업데이트
        updateBall();
        
        // 골인 지점 위치 업데이트
        updateGoalPosition();
        
        // 벽 위치 업데이트
        walls.forEach(wall => {
            // 벽의 중심 x, z 좌표
            const wallX = wall.position.x;
            const wallZ = wall.position.z;
            const wallHeight = 0.5; // 벽 높이 (중심까지의 높이)
            
            // 바닥 평면 상의 벽 위치에서의 y 좌표 계산
            const planeY = getPlaneYAtPoint(wallX, wallZ);
            
            // 벽의 y 위치를 바닥 위로 설정
            wall.position.y = planeY + wallHeight;
        });
        
        // 평면이 서서히 원래 위치로 돌아오게
        if (!isGameActive) {
            plane.rotation.x *= 0.95;
            plane.rotation.z *= 0.95;
        }
        
        // 씬 렌더링
        renderer.render(scene, camera);
    }
}