import { AuthService } from '../services/AuthService.js';
const authService = AuthService.getInstance();
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'username, email, and password are required'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }
        const result = await authService.register(username, email, password);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Registration failed'
        });
    }
};
export const login = async (req, res) => {
    try {
        const { emailOrUsername, email, username, password } = req.body;
        const identifier = emailOrUsername || email || username;
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        const result = await authService.login(identifier, password);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            error: err.message || 'Authentication failed'
        });
    }
};
export const getMe = (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        let user = authService.getUserById(req.user.userId);
        const userData = user ? user.toJSON() : {
            id: req.user.userId,
            username: req.user.username,
            email: req.user.email,
            createdAt: new Date().toISOString()
        };
        return res.status(200).json({
            success: true,
            data: { user: userData }
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to fetch user profile'
        });
    }
};
