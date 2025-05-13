const jwt = require("jsonwebtoken");
const JWT_SECRET = "Splendid_Ganesha"; // Make sure this matches exactly with the one used to sign the token

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET); // should give you { user: { id: "..." } }
    req.user = data.user; // <-- This must be an object with an `id` field
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = fetchuser;
