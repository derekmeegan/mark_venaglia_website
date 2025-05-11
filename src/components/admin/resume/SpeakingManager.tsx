import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { Speaking } from '../../../types/resume';

interface SpeakingManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const SpeakingManager: React.FC<SpeakingManagerProps> = ({
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [speaking, setSpeaking] = useState<Speaking[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSpeaking, setCurrentSpeaking] = useState<Speaking | null>(null);
  const [formData, setFormData] = useState({
    event_name: '',
    location: '',
    year: '',
    description: ''
  });

  useEffect(() => {
    fetchSpeaking();
  }, []);

  const fetchSpeaking = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_speaking')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setSpeaking(data || []);
    } catch (error) {
      console.error('Error fetching speaking engagements:', error);
      showNotification('Error', 'Failed to load speaking engagements');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      event_name: '',
      location: '',
      year: '',
      description: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditClick = (item: Speaking) => {
    setCurrentSpeaking(item);
    setFormData({
      event_name: item.event_name || '',
      location: item.location || '',
      year: item.year?.toString() || '',
      description: item.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('public_speaking')
        .insert([{
          event_name: formData.event_name,
          location: formData.location || null,
          year: formData.year ? parseInt(formData.year) : null,
          description: formData.description || null
        }]);

      if (error) throw error;

      showNotification('Success', 'Speaking engagement added successfully');
      setIsAddModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchSpeaking();
    } catch (error) {
      console.error('Error adding speaking engagement:', error);
      showNotification('Error', 'Failed to add speaking engagement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpeaking) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('public_speaking')
        .update({
          event_name: formData.event_name,
          location: formData.location || null,
          year: formData.year ? parseInt(formData.year) : null,
          description: formData.description || null
        })
        .eq('id', currentSpeaking.id);

      if (error) throw error;

      showNotification('Success', 'Speaking engagement updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchSpeaking();
    } catch (error) {
      console.error('Error updating speaking engagement:', error);
      showNotification('Error', 'Failed to update speaking engagement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this speaking engagement?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('public_speaking')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Speaking engagement deleted successfully');
      if (onDataChanged) onDataChanged();
      await fetchSpeaking();
    } catch (error) {
      console.error('Error deleting speaking engagement:', error);
      showNotification('Error', 'Failed to delete speaking engagement');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSpeakingList = () => {
    if (speaking.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No speaking engagements found.</p>
        </div>
      );
    }

    // Group speaking engagements by year
    const groupedByYear: Record<string, Speaking[]> = {};
    
    speaking.forEach(item => {
      const year = item.year?.toString() || 'Undated';
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push(item);
    });

    // Sort years in descending order
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
      if (a === 'Undated') return 1;
      if (b === 'Undated') return -1;
      return parseInt(b) - parseInt(a);
    });

    return (
      <div className="space-y-8">
        {sortedYears.map(year => (
          <div key={year} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{year}</h4>
            <div className="space-y-6">
              {groupedByYear[year].map(item => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg relative">
                  <h5 className="text-lg font-medium text-gray-800 pr-16">{item.event_name}</h5>
                  {item.location && <p className="text-gold font-medium mt-1">{item.location}</p>}
                  {item.description && <p className="text-gray-600 mt-2">{item.description}</p>}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Edit speaking engagement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Delete speaking engagement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAddModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isAddModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Add New Speaking Engagement</h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <label htmlFor="event_name" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                id="event_name"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.event_name}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Engagement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isEditModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Edit Speaking Engagement</h3>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-event_name" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                id="edit-event_name"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div>
              <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="edit-year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.event_name}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading && speaking.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-gold text-white rounded hover:bg-gold/90 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Engagement
        </button>
      </div>

      {renderSpeakingList()}
      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
};

export default SpeakingManager;
