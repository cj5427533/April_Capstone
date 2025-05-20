// 스크롤에 따라 배경 그라데이션 변경
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const documentHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollPosition / documentHeight) * 100;
    
    // 스크롤 위치에 따라 배경 위치 변경
    document.getElementById('dynamic-bg').style.backgroundPosition = `${scrollPercentage}% ${scrollPercentage/2}%`;
});

// 스크롤 애니메이션
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.section-animate');
    
    function checkIfInView() {
        const windowHeight = window.innerHeight;
        const windowTopPosition = window.scrollY;
        const windowBottomPosition = windowTopPosition + windowHeight;
        
        sections.forEach(function(section) {
            const elementHeight = section.offsetHeight;
            const elementTopPosition = section.offsetTop;
            const elementBottomPosition = elementTopPosition + elementHeight;
            
            // Element is in view if its top is visible or its bottom is visible
            if ((elementBottomPosition >= windowTopPosition) && 
                (elementTopPosition <= windowBottomPosition)) {
                section.classList.add('visible');
            }
        });
    }
    
    window.addEventListener('scroll', checkIfInView);
    window.addEventListener('resize', checkIfInView);
    
    // Trigger once at load
    checkIfInView();
});

// 연락처 폼 제출
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('formStatus');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch('https://proud-lab-22e2.cj542753315.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        formStatus.classList.remove('hidden');
        if (response.ok) {
            successMessage.classList.remove('hidden');
            errorMessage.classList.add('hidden');
            e.target.reset();
        } else {
            const errorText = await response.text();
            errorMessage.textContent = errorText;
            errorMessage.classList.remove('hidden');
            successMessage.classList.add('hidden');
        }
    } catch (error) {
        formStatus.classList.remove('hidden');
        errorMessage.textContent = '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
        errorMessage.classList.remove('hidden');
        successMessage.classList.add('hidden');
    }
}); 