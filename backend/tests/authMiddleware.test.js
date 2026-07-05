const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Middleware - protect', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'testsecret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no authorization header is present', async () => {
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next if valid token is provided', async () => {
        req.headers.authorization = 'Bearer validtoken';
        
        jwt.verify.mockReturnValue({ id: 'user123' });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'user123', username: 'testuser' })
        });

        await protect(req, res, next);
        
        expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or verification fails', async () => {
        req.headers.authorization = 'Bearer invalidtoken';
        
        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await protect(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
        expect(next).not.toHaveBeenCalled();
    });
});
