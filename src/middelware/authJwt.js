const jwt = require("jsonwebtoken");
const keys = require("./../../config/keys");

const User = require("./../models/users.model");
const Role = require("../models/roles.model");
const Contract = require("../models/contracts.model");
const { Count, UpdateById, Notify } = require('./../middelware/helper')

verifyToken = (req, res, next) => {
  try {
    let token = req.headers["x-access-token"];

    if (!token) {
      return res.status(403).json({ error: true, message: "No token provided!", data: "invalidToken" });
    }

    jwt.verify(token, keys.secretOrKey, (err, decoded) => {
      if (err) {
        console.log("if (err) error:", err)
        return res.status(403).json({ error: true, message: "TokenExpiredError", data: err });
      }
      decoded.user.id = decoded.id;
      req.decoded = decoded;
      next();
    });
  } catch (error) {
    console.log("catch error:", error)
    res.status(500).json({ error: true, message: "Internal server error", details: error.message });
  }
};

isAdmin = (req, res, next) => {
  try {
    User.findById(req.userId).exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      Role.find({ _id: { $in: user.roles } }, (err, roles) => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Admin Role!" });
      });
    });
  } catch (error) {
    res.status(500).send({ error: true, message: "Internal server error", details: error.message });
  }
};

isModerator = (req, res, next) => {
  try {
    User.findById(req.userId).exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      Role.find({ _id: { $in: user.roles } }, (err, roles) => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "moderator") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Moderator Role!" });
      });
    });
  } catch (error) {
    res.status(500).send({ error: true, message: "Internal server error", details: error.message });
  }
};

isAllowed = async (req, res, next) => {
  try {
    const staff = req.decoded.staff;
    const contractor = req.decoded.contractor;
    const user = req.decoded.user;
    const packOptions = req.decoded.pack.packOptions;

    // Check if Contracts are there
    const existContracts = await Count(Contract, { contractContractor: contractor.id }, -1);

    if (existContracts.length > packOptions.sites) {
      return res.status(403).send({
        error: true,
        message: "Upgrade your Pack",
        data: "Number of sites: " + existContracts.length,
      });
    } else {
      let validData = true;

      req.body.formData.forEach((data, dataIndex) => {
        let validContractID = false;

        existContracts.forEach((contract, contractIndex) => {
          if (data.siteContract === contract.id) {
            validContractID = true;
          }

          if (contractIndex === existContracts.length - 1 && !validContractID) {
            req.body.formData[dataIndex].siteContract = "InvalidContratct";
            validData = false;
          }
        });
      });

      next();
    }
  } catch (error) {
    res.status(500).send({ error: true, message: "Internal server error", details: error.message });
  }
};


const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isAllowed
};
module.exports = authJwt;