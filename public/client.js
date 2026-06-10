document.addEventListener('DOMContentLoaded', () => {
    const keywordInput = document.getElementById('keyword-input');
    const suggestionsList = document.getElementById('keywords-suggestions');
    const searchBtn = document.getElementById('search-btn');
    const errorMessage = document.getElementById('error-message');
    
    const urlsSection = document.getElementById('urls-section');
    const urlsList = document.getElementById('urls-list');
    
    const savedList = document.getElementById('saved-list');
    const viewerSection = document.getElementById('viewer-section');
    const contentViewer = document.getElementById('content-viewer');
    const networkStatus = document.getElementById('network-status');

    function updateNetworkStatus() {
        if (navigator.onLine) {
            networkStatus.textContent = 'Онлайн';
            networkStatus.className = 'status-indicator online';
            searchBtn.disabled = false;
        } else {
            networkStatus.textContent = 'Оффлайн';
            networkStatus.className = 'status-indicator offline';
            searchBtn.disabled = true;
            showError('Отсутствует подключение к сети. Доступен просмотр оффлайн контента.');
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    function showError(text) {
        errorMessage.textContent = text;
        errorMessage.classList.remove('hidden');
    }

    function clearError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    }

    async function loadSuggestions() {
        try {
            const response = await fetch('/api/keywords');
            if (!response.ok) throw new Error();
            const keywords = await response.json();
            suggestionsList.innerHTML = '';
            keywords.forEach(word => {
                const option = document.createElement('option');
                option.value = word;
                suggestionsList.appendChild(option);
            });
        } catch (e) {
            console.error('Не удалось загрузить автодополнение ключевых слов');
        }
    }

    async function handleSearch() {
        clearError();
        urlsSection.classList.add('hidden');
        const keyword = keywordInput.value.trim();

        if (!keyword) {
            showError('Пожалуйста, введите ключевое слово');
            return;
        }

        try {
            const response = await fetch('/api/get-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword })
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.error || 'Ошибка при получении списка URL');
                return;
            }

            renderUrls(data.urls);
        } catch (error) {
            showError('Не удалось связаться с сервером. Проверьте соединение.');
        }
    }

    searchBtn.addEventListener('click', handleSearch);

    keywordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    });

    function renderUrls(urls) {
        urlsList.innerHTML = '';
        urls.forEach(item => {
            const li = document.createElement('li');
            
            const urlSpan = document.createElement('span');
            urlSpan.className = 'url-link';
            urlSpan.textContent = item.title;
            urlSpan.addEventListener('click', () => downloadContent(item.url, item.title));

            const btn = document.createElement('button');
            btn.textContent = 'Скачать';
            btn.addEventListener('click', () => downloadContent(item.url, item.title));

            li.appendChild(urlSpan);
            li.appendChild(btn);
            urlsList.appendChild(li);
        });
        urlsSection.classList.remove('hidden');
    }

    async function downloadContent(url, title) {
        if (!navigator.onLine) {
            showError('Невозможно скачать контент в режиме оффлайн.');
            return;
        }

        clearError();

        try {
            const imgResponse = await fetch(url);
            if (!imgResponse.ok) {
                showError(`Не удалось загрузить изображение напрямую из браузера (Статус: ${imgResponse.status})`);
                return;
            }

            const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
            const blob = await imgResponse.blob();
            
            const base64Content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const serverResponse = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    contentType: contentType,
                    content: base64Content,
                    title: title
                })
            });

            const data = await serverResponse.json();

            if (!serverResponse.ok) {
                showError(data.error || 'Ошибка при регистрации файла на сервере');
                return;
            }

            saveToLocalStorage(data);
            renderSavedContent();
            displayContent(data);
        } catch (error) {
            showError('Ошибка сети при прямой загрузке картинки браузером.');
        }
    }

    function saveToLocalStorage(item) {
        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('downloaded_content')) || [];
        } catch (e) {
            saved = [];
        }

        const index = saved.findIndex(element => element.url === item.url);
        const timestamp = new Date().toLocaleString();
        
        const dataToSave = {
            ...item,
            savedAt: timestamp
        };

        if (index !== -1) {
            saved[index] = dataToSave;
        } else {
            saved.push(dataToSave);
        }

        localStorage.setItem('downloaded_content', JSON.stringify(saved));
    }

    function renderSavedContent() {
        savedList.innerHTML = '';
        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('downloaded_content')) || [];
        } catch (e) {
            saved = [];
        }

        if (saved.length === 0) {
            savedList.innerHTML = '<li style="color: #aaa; padding: 10px 0;">Нет загруженного контента</li>';
            return;
        }

        saved.forEach(item => {
            const li = document.createElement('li');
            li.className = 'saved-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'saved-item-info';

            const urlDiv = document.createElement('div');
            urlDiv.className = 'saved-item-url';
            urlDiv.textContent = item.title || item.url;

            const metaDiv = document.createElement('div');
            metaDiv.className = 'saved-item-meta';
            metaDiv.textContent = `Сохранено: ${item.savedAt}`;

            infoDiv.appendChild(urlDiv);
            infoDiv.appendChild(metaDiv);

            const actionBtns = document.createElement('div');
            actionBtns.className = 'action-btns';

            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn-view';
            viewBtn.textContent = 'Посмотреть';
            viewBtn.addEventListener('click', () => displayContent(item));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Удалить';
            deleteBtn.addEventListener('click', () => deleteContent(item.url));

            actionBtns.appendChild(viewBtn);
            actionBtns.appendChild(deleteBtn);

            li.appendChild(infoDiv);
            li.appendChild(actionBtns);
            savedList.appendChild(li);
        });
    }

    function deleteContent(url) {
        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('downloaded_content')) || [];
        } catch (e) {
            saved = [];
        }
        
        saved = saved.filter(item => item.url !== url);
        localStorage.setItem('downloaded_content', JSON.stringify(saved));
        renderSavedContent();
        
        if (!viewerSection.classList.contains('hidden')) {
            viewerSection.classList.add('hidden');
        }
    }

    function displayContent(item) {
        contentViewer.innerHTML = '';
        viewerSection.classList.remove('hidden');

        const img = document.createElement('img');
        img.src = `data:${item.contentType};base64,${item.content}`;
        contentViewer.appendChild(img);
        
        viewerSection.scrollIntoView({ behavior: 'smooth' });
    }

    loadSuggestions();
    renderSavedContent();
    updateNetworkStatus();
});