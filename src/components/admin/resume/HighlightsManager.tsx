import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { Highlight } from '../../../types/resume';

interface HighlightsManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const HighlightsManager: React.FC<HighlightsManagerProps> = ({
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<Highlight | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    role: '',
    description: '',
    city: '',
    state: '',
    country: 'USA',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      showNotification('Error', 'Failed to load highlights data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      organization: '',
      role: '',
      description: '',
      city: '',
      state: '',
      country: 'USA',
      start_date: '',
      end_date: ''
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

  const handleEditClick = (highlight: Highlight) => {
    setCurrentHighlight(highlight);
    setFormData({
      title: highlight.title || '',
      organization: highlight.organization || '',
      role: highlight.role || '',
      description: highlight.description || '',
      city: highlight.city || '',
      state: highlight.state || '',
      country: highlight.country || 'USA',
      start_date: highlight.start_date ? highlight.start_date.substring(0, 10) : '',
      end_date: highlight.end_date ? highlight.end_date.substring(0, 10) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('highlights')
        .insert([{
          title: formData.title,
          organization: formData.organization || null,
          role: formData.role || null,
          description: formData.description || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || 'USA',
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        }]);

      if (error) throw error;

      showNotification('Success', 'Highlight added successfully');
      setIsAddModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchHighlights();
    } catch (error) {
      console.error('Error adding highlight:', error);
      showNotification('Error', 'Failed to add highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHighlight) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('highlights')
        .update({
          title: formData.title,
          organization: formData.organization || null,
          role: formData.role || null,
          description: formData.description || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || 'USA',
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
        .eq('id', currentHighlight.id);

      if (error) throw error;

      showNotification('Success', 'Highlight updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchHighlights();
    } catch (error) {
      console.error('Error updating highlight:', error);
      showNotification('Error', 'Failed to update highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Highlight deleted successfully');
      if (onDataChanged) onDataChanged();
      await fetchHighlights();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      showNotification('Error', 'Failed to delete highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const renderHighlightsList = () => {
    if (highlights.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No highlights found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {highlights.map(highlight => (
          <div key={highlight.id} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{highlight.title}</h4>
                {(highlight.organization || highlight.role) && (
                  <p className="text-gold font-medium mt-1">
                    {highlight.organization}{highlight.organization && highlight.role ? ' • ' : ''}{highlight.role}
                  </p>
                )}
                {(highlight.city || highlight.state || highlight.country) && (
                  <p className="text-gray-500 text-sm mt-1">
                    {[highlight.city, highlight.state, highlight.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {(highlight.start_date) && (
                  <p className="text-gray-600 text-sm mt-1">
                    {formatDate(highlight.start_date)} - {formatDate(highlight.end_date)}
                  </p>
                )}
                {highlight.description && <p className="text-gray-700 mt-3">{highlight.description}</p>}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(highlight)}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Edit highlight"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(highlight.id)}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Delete highlight"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAddModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isAddModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Add New Highlight</h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (leave blank for present)
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
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
                disabled={isLoading || !formData.title}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Highlight'}
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
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Edit Highlight</h3>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-organization" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  id="edit-organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="edit-city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="edit-state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="edit-state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="edit-country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="edit-country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="edit-start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="edit-end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (leave blank for present)
                </label>
                <input
                  type="date"
                  id="edit-end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
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
                disabled={isLoading || !formData.title}
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

  if (isLoading && highlights.length === 0) {
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
          <Plus className="w-4 h-4 mr-2" /> Add Highlight
        </button>
      </div>

      {renderHighlightsList()}
      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
};

export default HighlightsManager;
