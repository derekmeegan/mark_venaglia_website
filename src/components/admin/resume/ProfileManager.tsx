import { useState, useEffect } from 'react';
import { Edit, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { ArtistProfile } from '../../../types/resume';

interface ProfileManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ 
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    artist_statement: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('artist_profile')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          bio: data.bio || '',
          artist_statement: data.artist_statement || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      showNotification('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;

      if (profile) {
        // Update existing profile
        response = await supabase
          .from('artist_profile')
          .update({
            bio: formData.bio,
            artist_statement: formData.artist_statement,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      } else {
        // Create new profile
        response = await supabase
          .from('artist_profile')
          .insert([
            {
              bio: formData.bio,
              artist_statement: formData.artist_statement
            }
          ]);
      }

      if (response.error) throw response.error;

      showNotification('Success', 'Profile updated successfully');
      setIsEditing(false);
      if (onDataChanged) onDataChanged();
      await fetchProfileData();
    } catch (error) {
      console.error('Error saving profile data:', error);
      showNotification('Error', 'Failed to save profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileView = () => {
    if (!profile) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No profile information found.</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Biography</h3>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
            {profile.bio || <span className="text-gray-400 italic">No biography added</span>}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Artist Statement</h3>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
            {profile.artist_statement || <span className="text-gray-400 italic">No artist statement added</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderProfileForm = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Biography
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Use *** to create paragraph breaks in the content.
          </p>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={10}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter biography here..."
          />
        </div>

        <div>
          <label htmlFor="artist_statement" className="block text-sm font-medium text-gray-700 mb-1">
            Artist Statement
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Use *** to create paragraph breaks in the content.
          </p>
          <textarea
            id="artist_statement"
            name="artist_statement"
            value={formData.artist_statement}
            onChange={handleInputChange}
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter artist statement here..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  };

  if (isLoading && !isEditing) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gold text-white rounded hover:bg-gold/90 transition-colors flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </button>
      </div>
      {isEditing ? renderProfileForm() : renderProfileView()}
    </div>
  );
};

export default ProfileManager;
