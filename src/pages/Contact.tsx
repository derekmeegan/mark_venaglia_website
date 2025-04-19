import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import SEO from '../components/SEO';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: 'Custom Tour Request',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: FormEvent): Promise<void> => {
  e.preventDefault();
  setIsSubmitting(true);

  if (validateForm()) {
    try {
      const res = await fetch(
        "https://dvytdwbpqaupkodiuyom.functions.supabase.co/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(formData)
        }
      );
      console.log(await res.text());

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

      setFormData({
        name: "",
        email: "",
        subject: "Custom Tour Request",
        message: ""
      });
      setShowThankYouModal(true);
    } catch {
      setErrors({ ...errors, submit: "Failed to send message. Please try again." });
    }
  }
  setIsSubmitting(false);
};



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Contact Mark Venaglia | Get in Touch"
        description="Contact Mark Venaglia for inquiries about art tours, commissions, exhibitions, or corporate solutions. Get in touch with us today."
        url="https://markvenaglia.com/contact"
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="w-full md:w-1/2">
              <img
                src="/contact.png"
                alt="Empire State Building"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Form Section */}
            <div className="w-full md:w-1/2 p-6">
              <h1 className="text-2xl font-bold text-charcoal mb-4">Get in Touch</h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-cream bg-cream/50 px-3 py-1.5 text-charcoal shadow-sm focus:border-gold focus:ring-gold ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-cream bg-cream/50 px-3 py-1.5 text-charcoal shadow-sm focus:border-gold focus:ring-gold ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-charcoal">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-cream bg-cream/50 px-3 py-1.5 text-charcoal shadow-sm focus:border-gold focus:ring-gold"
                  >
                    <option>Commission Inquiry</option>
                    <option>Custom Tour Request</option>
                    <option>Tour Booking</option>
                    <option>General Question</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-charcoal">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-cream bg-cream/50 px-3 py-1.5 text-charcoal shadow-sm focus:border-gold focus:ring-gold ${
                      errors.message ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Thank You Modal */}
        {showThankYouModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative animate-fade-in">
              <button
                onClick={() => setShowThankYouModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-charcoal mb-4">Thank You!</h2>
                <p className="text-gray-600 mb-6">
                  I appreciate you reaching out. I'll get back to you as soon as possible. In the meantime, feel free to explore more of my work.
                </p>
                <Link
                  to="/portfolio"
                  onClick={() => setShowThankYouModal(false)}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;