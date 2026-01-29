"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = exports.generateAuthToken = exports.verifySessionToken = exports.generateSessionToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const generateSessionToken = (payload, expiresInSeconds) => {
    const options = {
        expiresIn: expiresInSeconds,
    };
    return jwt.sign(payload, JWT_SECRET, options);
};
exports.generateSessionToken = generateSessionToken;
const verifySessionToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
exports.verifySessionToken = verifySessionToken;
const generateAuthToken = (payload, expiresInSeconds = 60 * 60 * 24 * 7) => {
    const options = { expiresIn: expiresInSeconds };
    return jwt.sign(payload, JWT_SECRET, options);
};
exports.generateAuthToken = generateAuthToken;
const verifyAuthToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
exports.verifyAuthToken = verifyAuthToken;
