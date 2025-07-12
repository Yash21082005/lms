import { clerkClient } from '@clerk/express';
import { v2 as cloudinary } from 'cloudinary';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { Purchase } from '../models/Purchase.js';
import mongoose from 'mongoose';

// ✅ Update role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'educator' },
    });

    res.json({ success: true, message: 'You can publish a course now' });
  } catch (error) {
    console.error('updateRoleToEducator error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Add New Course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;

    if (!imageFile) {
      return res.json({ success: false, message: 'Thumbnail Not Attached' });
    }

    const parsedCourseData = JSON.parse(courseData);
    parsedCourseData.educator = educatorId;

    const newCourse = await Course.create(parsedCourseData);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    newCourse.courseThumbnail = imageUpload.secure_url;
    await newCourse.save();

    res.json({ success: true, message: 'Course Added' });
  } catch (error) {
    console.error('addCourse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Educator Courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    console.error('getEducatorCourses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Educator Dashboard Data (with detailed logging)
export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    console.log("Educator ID:", educator);

    const courses = await Course.find({ educator });
    console.log("Courses found:", courses);

    const totalCourses = courses.length;
    const courseIds = courses.map((course) => course._id);
    console.log("Course IDs:", courseIds);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed',
    });

    console.log("Purchases found:", purchases);

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + (purchase.amount || 0),
      0
    );

    const enrolledStudentsData = [];

    for (const course of courses) {
      if (!Array.isArray(course.enrolledStudents)) continue;

      const students = await User.find(
        { _id: { $in: course.enrolledStudents } },
        'name imageUrl'
      );

      console.log(`Students in course "${course.courseTitle}":`, students);

      students.forEach((student) => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    console.error('educatorDashboardData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Enrolled Students Data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed',
    })
      .populate('userId', 'name imageUrl')
      .populate('courseId', 'courseTitle');

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    console.error('getEnrolledStudentsData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
