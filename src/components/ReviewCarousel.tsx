import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { supabase } from '../lib/supabase';

interface Review {
  id: number;
  reviewer_name: string;
  reviewer_profile: string;
  avatar_url: string;
  contributions: string;
  helpful_votes: string;
  rating: number;
  review_title: string;
  review_text: string;
  date: string;
}

const ReviewCarousel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 0) {
      setCurrentReview(reviews[currentIndex]);
      setIsTextExpanded(false); // Reset expanded state when review changes
    }
  }, [reviews, currentIndex]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const nextReview = () => {
    if (isTransitioning || !reviews.length) return;
    
    setIsTransitioning(true);
    
    // Start fade out
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
      setCurrentReview(reviews[(currentIndex + 1) % reviews.length]);
      
      // Wait a bit then fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const previousReview = () => {
    if (isTransitioning || !reviews.length) return;
    
    setIsTransitioning(true);
    
    // Start fade out
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
      setCurrentReview(reviews[(currentIndex - 1 + reviews.length) % reviews.length]);
      
      // Wait a bit then fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating ? 'fill-gold text-gold' : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (!reviews.length || !currentReview) {
    return null;
  }

  return (
    <div className="relative bg-white rounded-xl shadow-lg p-8">
      {/* Review Counter */}
      <div className="absolute top-4 right-4 text-sm text-gray-500">
        {currentIndex + 1}/{reviews.length}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={previousReview}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg text-gold hover:bg-gold/10 transition-colors"
        aria-label="Previous review"
        disabled={isTransitioning}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextReview}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg text-gold hover:bg-gold/10 transition-colors"
        aria-label="Next review"
        disabled={isTransitioning}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Review Content */}
      <div className="max-w-2xl mx-auto px-8">
        <div 
          className={`flex flex-col items-center text-center transition-opacity duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Avatar */}
          {currentReview.avatar_url ? (
            <img
              src={currentReview.avatar_url}
              alt={currentReview.reviewer_name}
              className="w-16 h-16 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
              <span className="text-gold text-xl font-bold">
                {currentReview.reviewer_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Rating */}
          <div className="flex space-x-1 mb-4">
            {renderStars(currentReview.rating)}
          </div>

          {/* Review Title */}
          {currentReview.review_title && (
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentReview.review_title}
            </h3>
          )}

          {/* Review Text */}
          <p 
            className={`text-gray-600 mb-6 ${isTextExpanded ? '' : 'line-clamp-4'} cursor-pointer transition-all duration-300`}
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            title={isTextExpanded ? "Click to collapse" : "Click to expand"}
          >
            {currentReview.review_text}
          </p>

          {/* Reviewer Info */}
          <div className="flex flex-col items-center">
            <Link to={currentReview.reviewer_profile} className="font-medium text-gray-900 hover:underline">
              {currentReview.reviewer_name}
            </Link>
            <p className="text-sm text-gray-500">
              {new Date(currentReview.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCarousel;