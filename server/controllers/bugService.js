import Bugs from "../models/bugs.js";
import Projects from "../models/projects.js";
import User from "../models/user.js";
import mongooseArchive from "mongoose-archive";

// Bugs.plugin(mongooseArchive);

export const createBugs = async (request, response) => {
  const selfID = request.user.id;
  const { name, description, priority, status, deadline, prjID, devID } =
    request.body;

  var assignID;
  if (devID === "$self") {
    assignID = selfID;
  } else {
    assignID = devID;
  }

  const dev = await User.findById(assignID);
  const devName = dev.username;
  const newBug = new Bugs({
    name,
    description,
    priority,
    status,
    deadline,
    prjID,
    devID: assignID,
    devName: devName,
  });

  try {
    await newBug.save();
    await Projects.updateOne(
      { _id: prjID },
      {
        $addToSet: {
          bugs: newBug._id,
        },
      }
    );

    response.status(201).json(newBug);
  } catch (error) {
    response.status(409).json({ message: error.message });
  }
};

export const getBugsByID = async (request, response) => {
  try {
    // console.log(request.params);
    const bugID = request.params.bugID;

    const bug = await Bugs.findById(bugID);

    response.status(200).json(bug);
    // return bug;
  } catch (error) {
    response.status(404).json({ message: error.message });
  }
};

export const archiveBug = async (request, response) => {
  console.log(request.body);
  const bugID = request.params.bugID;

  const bug = await Bugs.archive(bugID);

  response.status(200).json(bug);
};

export const deleteBug = async (request, response) => {
  console.log(request.body);
  const bugID = request.params.bugID;

  try {
    await Bugs.deleteOne({ _id: bugID });

    response.status(200).json({ message: "Success" });
  } catch (err) {
    response.status(400).json({ error: err });
  }
};

export const markResolved = async (request, response) => {
  console.log(request.body);
  const bugID = request.params.bugID;

  try {
    const bug = await Bugs.findOneAndUpdate(
      { _id: bugID },
      { $set: { status: "Resolved" } }
    );

    response.status(200).json(bug);
  } catch (err) {
    response.status(400).json({ error: err });
  }
};

export const getBugs = async (req, res) => {
  const { userID } = req.query;
  const prjID = req.params.projectID;

  var bugs;
  try {
    if (userID) {
      bugs = await Bugs.find({
        $and: [{ prjID: prjID }, { devID: userID }],
      }).sort({
        status: -1,
      });
    } else {
      bugs = await Bugs.find({
        $or: [{ prjID: prjID }],
      }).sort({
        status: -1,
      });
    }

    res.status(200).json(bugs);
  } catch (error) {
    res.status(404).json({ message: "No bugs found" });
  }
};
