document.addEventListener("DOMContentLoaded", function () {
    // Configuration
    const CONFIG = {
        API_URL: "your_huggingface_url_link",
        API_KEY: "your_huggingface_api_key", // Replace with your actual API key
        MAX_HISTORY: 5,
        TYPING_DELAY: 4000
    };

    // DOM Element References
    const elements = {
        chatbotButton: document.getElementById("chatbot-button"),
        chatbotContainer: document.getElementById("chatbot-container"),
        closeChatbotButton: document.getElementById("close-chatbot"),
        chatbotMessages: document.getElementById("chatbot-messages"),
        userInput: document.getElementById("user-input"),
        sendButton: document.getElementById("send-button"),
        voiceButton: document.getElementById("voice-button") // New button for voice input
    };

    // Conversation Management
    class ChatManager {
        constructor() {
            this.conversationHistory = [];
            this.responseCache = new Map();
        }

        trimHistory() {
            if (this.conversationHistory.length > CONFIG.MAX_HISTORY * 2) {
                this.conversationHistory = this.conversationHistory.slice(-CONFIG.MAX_HISTORY * 2);
            }
        }

        addToHistory(message, sender) {
            this.conversationHistory.push({ text: message, sender });
            this.trimHistory();
        }

        getContextualPrompt(userMessage) {
            const recentHistory = this.conversationHistory
                .slice(-CONFIG.MAX_HISTORY * 2)
                .map(msg => `${msg.sender}: ${msg.text}`)
                .join('\n');

            return `You are an expert in museums. You answer questions about exhibits, opening hours, ticket prices, events, ticket booking, ticket cancellation, and the history of the museum. Use this information to provide clear and concise answers.
            \n\n
            [
            {
                "name": "The National Gallery of Modern Art",
                "description": "A premier art gallery showcasing modern and contemporary Indian art.",
                "location": "New Delhi, India",
                "booking_url": "https://ngmaindia.gov.in/",
                "operating_hours": "10 AM - 5 PM",
                "featured_exhibits": ["Raja Ravi Varma Paintings", "Amrita Sher-Gil Collection"]
            },
            {
                "name": "Indian Museum",
                "description": "The largest and oldest museum in India, housing a vast collection of artifacts.",
                "location": "Kolkata, India",
                "booking_url": "https://indianmuseumkolkata.org/",
                "operating_hours": "10 AM - 5 PM",
                "featured_exhibits": ["Buddhist Stupa", "Egyptian Mummy"]
            },
            {
                "name": "Madras Museum",
                "description": "A repository of art, archaeology, and numismatics in Chennai, India.",
                "location": "Chennai, India",
                "booking_url": "https://museums.tn.gov.in/",
                "operating_hours": "9:30 AM - 5 PM",
                "featured_exhibits": ["South Indian Bronzes", "Amaravati Sculptures"]
            }]

            \n\nConversation History:\n${recentHistory}\n\nUser Message: ${userMessage}\n\nMuseum-Specific Response:`;
        }

        cacheResponse(message, response) {
            this.responseCache.set(message, response);
        }

        getCachedResponse(message) {
            return this.responseCache.get(message);
        }

        hasCachedResponse(message) {
            return this.responseCache.has(message);
        }
    }

    // UI Interaction Utilities
    const UIUtils = {
        displayMessage(text, isBot = true) {
            const message = document.createElement("div");
            message.className = isBot ? "bot-message" : "user-message";
            message.innerHTML = text;
            elements.chatbotMessages.appendChild(message);
            elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
        },

        showTypingIndicator() {
            const typingMessage = document.createElement("div");
            typingMessage.className = "bot-message";
            typingMessage.textContent = "Typing...";
            elements.chatbotMessages.appendChild(typingMessage);
            elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
            return typingMessage;
        }
    };

    // API Interaction Service
    class HuggingFaceService {
        static async fetchResponse(userMessage, chatManager) {
            if (chatManager.hasCachedResponse(userMessage)) {
                return chatManager.getCachedResponse(userMessage);
            }

            try {
                const prompt = chatManager.getContextualPrompt(userMessage);

                const response = await fetch(CONFIG.API_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${CONFIG.API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            max_new_tokens: 250,
                            temperature: 0.5,
                            top_k: 40,
                            top_p: 0.9
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                const fullGeneratedText = data[0]?.generated_text || this.getFallbackResponse();
                const botResponse = this.extractModelResponse(fullGeneratedText, prompt);
const bookingKeywords = ["ticket", "booking", "book ticket", "tickets"];
const cancellationKeywords = ["cancel", "cancellation", "refund", "ticket cancel"];

// Define the actual booking and cancellation links for the museum
const museumBookingLink = "http://museum-website.com/book"; // Replace with the actual museum's booking link

// Check if the user's query is about ticket booking or cancellation
const isBookingQuery = bookingKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
const isCancellationQuery = cancellationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

// Process the response based on the query type
if (isBookingQuery) {
    const actualLinkMatch = botResponse.match(/https?:\/\/[^\s]+/);
    const actualLink = actualLinkMatch ? actualLinkMatch[0] : museumBookingLink; // Default to museum's actual booking link
    const customBookingLink = `<a href="http://127.0.0.1:5000">BOOK NOW</a>`;

    const finalResponse = `
        ${botResponse}<br><br>
        Actual booking link: <a href="${actualLink}" target="_blank">${actualLink}</a><br>
        Custom booking link: ${customBookingLink}
    `;
    chatManager.cacheResponse(userMessage, finalResponse);
    return finalResponse;
} else if (isCancellationQuery) {
    // Provide a direct response for cancellation queries without links
    const finalResponse = `
        We understand you want to cancel your ticket or request a refund. 
        Please contact our support team at support@museum-website.com for further assistance. 
        Include your ticket details in the email for a quicker resolution.
    `;
    chatManager.cacheResponse(userMessage, finalResponse);
    return finalResponse;
}

else {
    chatManager.cacheResponse(userMessage, botResponse);
    return botResponse;
}




            } catch (error) {
                console.error("API Interaction Error:", error);
                return this.getFallbackResponse();
            }
        }

        static extractModelResponse(fullText, prompt) {
            const botResponse = fullText.replace(prompt, '').trim();
            const cleanedResponse = botResponse.replace(/^(Museum-Specific Response:|\n)/g, '').trim();
            const responseLines = cleanedResponse.split('\n');
            return responseLines[0].trim();
        }

        static getFallbackResponse() {
            const fallbacks = [
                "I'm processing your request. Can you provide more details?",
                "That's an intriguing question about the museum. Let me think.",
                "I'm here to help. Could you clarify your query?",
                "Can you rephrase that? I'll do my best to assist."
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }

    // Chatbot Controller
    class ChatbotController {
        constructor() {
            this.chatManager = new ChatManager();
            this.initEventListeners();
        }

        initEventListeners() {
            elements.chatbotButton.addEventListener("click", () => this.openChatbot());
            elements.closeChatbotButton.addEventListener("click", () => this.closeChatbot());
            elements.sendButton.addEventListener("click", () => this.handleUserMessage());
            elements.userInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.handleUserMessage();
            });

            // Voice Input Button Event Listener
            elements.voiceButton.addEventListener("click", () => this.startVoiceRecognition());
        }

        openChatbot() {
            elements.chatbotContainer.style.display = "block";
            elements.chatbotMessages.innerHTML = "";
            UIUtils.displayMessage("Welcome! Ask me anything about our museum, and I'll do my best to assist.");
        }

        closeChatbot() {
            elements.chatbotContainer.style.display = "none";
        }

        async handleUserMessage() {
            const userMessage = elements.userInput.value.trim();
            if (!userMessage) return;

            UIUtils.displayMessage(userMessage, false);
            this.chatManager.addToHistory(userMessage, 'user');
            elements.userInput.value = "";

            const typingIndicator = UIUtils.showTypingIndicator();

            try {
                await new Promise(resolve => setTimeout(resolve, CONFIG.TYPING_DELAY));
                elements.chatbotMessages.removeChild(typingIndicator);

                const botResponse = await HuggingFaceService.fetchResponse(userMessage, this.chatManager);
                UIUtils.displayMessage(botResponse);
                this.chatManager.addToHistory(botResponse, 'bot');

            } catch (error) {
                console.error("Message handling error:", error);
                UIUtils.displayMessage("Sorry, something went wrong.");
            }
        }

        // Voice Recognition Feature
        startVoiceRecognition() {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = "en-US";
            recognition.interimResults = false;

            recognition.start();

            recognition.onresult = (event) => {
                const userMessage = event.results[0][0].transcript;
                elements.userInput.value = userMessage;
                this.handleUserMessage();
            };

            recognition.onerror = (event) => {
                console.error("Voice recognition error:", event.error);
                UIUtils.displayMessage("Sorry, I couldn't understand your voice input.");
            };
        }
    }

    // Initialize Chatbot
    new ChatbotController();
});
