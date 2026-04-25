const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role missing",
        });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${role}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Role middleware error",
      });
    }
  };
};

module.exports = roleMiddleware;