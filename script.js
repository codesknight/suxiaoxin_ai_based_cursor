// 对话列表
let chats = [];

// 当前选中的对话
let currentChat = null;

// API配置
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_KEY = 'ded205d935ddee96ac01b52c5c5cf1e2.YFrNdSlrpjTqtsgZ';

// 添加一个全局变量来存储AI的名字
const AI_NAME = "苏小欣";

// 初始化函数
function init() {
    document.getElementById('newChat').addEventListener('click', createNewChat);
    document.getElementById('sendMessage').addEventListener('click', handleSendMessage);
    document.getElementById('userInput').addEventListener('keydown', handleInputKeydown);
    loadChats();
    renderChatList();
    initResizers();

    // 添加处理移动设备的代码
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').style.height = '30vh';
        document.getElementById('chatMain').style.height = '70vh';
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    // 在init函数中添加以下行
    window.addEventListener('load', handleResize);
}

// 加载对话
function loadChats() {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
}

// 保存对话
function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// 创建新对话
function createNewChat() {
    const title = '新对话';
    const newChat = {
        id: Date.now(),
        title: title,
        createdAt: new Date(),
        messages: []
    };
    chats.unshift(newChat);
    saveChats();
    renderChatList();
    selectChat(newChat.id);
    scrollChatIntoView(newChat.id); // 添加这行
}

// 删除对话
function deleteChat(chatId) {
    if (confirm('确定要删除这个对话吗？')) {
        chats = chats.filter(chat => chat.id !== chatId);
        saveChats();
        renderChatList();
        if (currentChat && currentChat.id === chatId) {
            currentChat = null;
            renderChatContent();
        }
    }
}

// 修改渲染对话列表函数
function renderChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.setAttribute('data-chat-id', chat.id); // 添加这行
        chatItem.innerHTML = `
            <input type="text" value="${chat.title}" onchange="updateChatTitle(${chat.id}, this.value)">
            <button class="delete-btn" onclick="deleteChat(${chat.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        chatItem.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SVG' && e.target.tagName !== 'PATH') {
                selectChat(chat.id);
            }
        });
        chatList.appendChild(chatItem);
    });
}

// 添加更新对话标题的函数
function updateChatTitle(chatId, newTitle) {
    const chat = chats.find(chat => chat.id === chatId);
    if (chat) {
        chat.title = newTitle;
        saveChats();
    }
}

// 选择对话
function selectChat(chatId) {
    currentChat = chats.find(chat => chat.id === chatId);
    renderChatContent();
    scrollChatIntoView(chatId); // 添加这行
}

// 修改渲染对话内容的函数
function renderChatContent() {
    const chatContent = document.getElementById('chatContent');
    if (currentChat) {
        chatContent.innerHTML = '';
        currentChat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.role}`;
            messageDiv.innerHTML = `
                <div class="avatar"></div>
                <div class="content">${message.content}</div>
            `;
            chatContent.appendChild(messageDiv);
        });
        chatContent.scrollTop = chatContent.scrollHeight;
    } else {
        chatContent.innerHTML = '<p>请选择或创建一个对话</p>';
    }
}

// 发送消息
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    if (message) {
        currentChat.messages.push({ role: 'user', content: message });
        renderChatContent();
        userInput.value = '';
        saveChats();

        try {
            const response = await callAIAPI(currentChat.messages);
            currentChat.messages.push({ role: 'assistant', content: response });
            renderChatContent();
            saveChats();
        } catch (error) {
            console.error('AI API调用失败:', error);
            alert('AI回复失败，请稍后重试。');
        }
    }
}

// 调用AI API
async function callAIAPI(messages) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'glm-4',
            messages: messages
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 添加拖拽功能
function initResizers() {
    const sidebarResizer = document.getElementById('sidebarResizer');
    const inputResizer = document.getElementById('inputResizer');
    const sidebar = document.getElementById('sidebar');
    const inputArea = document.getElementById('inputArea');

    let isResizingSidebar = false;
    let isResizingInput = false;

    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizingSidebar = true;
        document.addEventListener('mousemove', handleSidebarResize);
        document.addEventListener('mouseup', stopResize);
    });

    inputResizer.addEventListener('mousedown', (e) => {
        isResizingInput = true;
        document.addEventListener('mousemove', handleInputResize);
        document.addEventListener('mouseup', stopResize);
    });

    function handleSidebarResize(e) {
        if (isResizingSidebar && window.innerWidth > 768) {
            const newWidth = e.clientX;
            sidebar.style.width = `${newWidth}px`;
        }
    }

    function handleInputResize(e) {
        if (isResizingInput) {
            const chatMain = document.getElementById('chatMain');
            const newHeight = chatMain.clientHeight - e.clientY + chatMain.offsetTop;
            inputArea.style.height = `${newHeight}px`;
        }
    }

    function stopResize() {
        isResizingSidebar = false;
        isResizingInput = false;
        document.removeEventListener('mousemove', handleSidebarResize);
        document.removeEventListener('mousemove', handleInputResize);
    }
}

// 初始化
init();

// 添加处理输入框键盘事件的函数
function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

// 修改发送消息的函数
function handleSendMessage() {
    if (!currentChat) {
        createNewChat();
    }
    sendMessage();
}

// 添加处理窗口大小变化的函数
function handleResize() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').style.height = '40vh';
        document.getElementById('chatMain').style.height = '60vh';
        document.getElementById('sidebar').style.width = '100%';
        document.getElementById('chatContent').style.height = 'calc(100% - 120px)'; // 减去头部和输入区域的高度
    } else {
        document.getElementById('sidebar').style.height = '100%';
        document.getElementById('chatMain').style.height = '100%';
        document.getElementById('sidebar').style.width = '260px';
        document.getElementById('chatContent').style.height = 'calc(100% - 60px)'; // 减去头部高度
    }
    // 强制重新计算布局
    window.dispatchEvent(new Event('resize'));
}

// 在 script.js 中添加以下函数
function scrollChatIntoView(chatId) {
    const chatList = document.getElementById('chatList');
    const chatElement = chatList.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatElement) {
        chatElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
