"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const music_routes_1 = __importDefault(require("./routes/music.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const app = (0, express_1.default)();
const PORT = 3000;
// Allow cookies to be sent from the frontend dev server
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/upload', upload_routes_1.default);
app.use('/api/music', music_routes_1.default);
app.use('/api/session', session_routes_1.default);
app.listen(PORT, () => {
    console.log("Server running on", PORT);
});
