import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';
import axios from 'axios';

const CoursesSection = () => {
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/courses/all`);
        if (res.data.success) {
          setAllCourses(res.data.courses);
        }
      } catch (err) {
        console.error("Error fetching courses in CoursesSection:", err);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="py-16 md:px-40 px-8">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-medium text-gray-800">
          Learn from the best
        </h2>

        <p className="text-sm md:text-base text-gray-500 mt-3">
          Discover our top-rated courses across various categories. From coding
          and design to business and wellness, our courses are crafted to
          deliver real-world results.
        </p>

        <div className="grid grid-cols-auto px-4 md:px-0 md:my-16 my-10 gap-4">
          {allCourses.slice(0, 4).map((course, index) => (
            <CourseCard key={index} course={course} />
          ))}
        </div>

        <Link
          to="/course-list"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block mt-8 text-gray-600 border border-gray-500/30 px-10 py-3 rounded
                     hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300/60"
        >
          Show all courses
        </Link>
      </div>
    </section>
  );
};

export default CoursesSection;
