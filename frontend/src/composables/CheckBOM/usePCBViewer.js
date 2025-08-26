// Composable for PCB viewer logic
import { ref, reactive, computed } from 'vue'
import axios from 'axios'

export function usePCBViewer() {
  // Reactive data
  const projects = ref([
    { id: 1, name: 'Project 1' },
    { id: 2, name: 'Project 2' }
  ])

  const selectedProject = ref(1)
  const gerberData = ref([])
  const pickPlaceData = ref([])
  const gerberSVGs = reactive({})
  const loading = ref(false)

  // API methods
  const loadProjectData = async () => {
    if (!selectedProject.value) return
    
    loading.value = true
    try {
      const response = await axios.get(`http://localhost:3000/pcb-data/${selectedProject.value}`)
      gerberData.value = response.data.gerber
      pickPlaceData.value = response.data.pickplace
      
      const layersResponse = await axios.get(`http://localhost:3000/layers/${selectedProject.value}`)
      return layersResponse.data
    } catch (error) {
      console.error('Error loading PCB data:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  const generateLayerSVGs = async (layers) => {
    Object.keys(gerberSVGs).forEach(key => delete gerberSVGs[key])
    
    for (const layer of layers) {
      try {
        const response = await axios.post(`http://localhost:3000/generate-svg/${selectedProject.value}`, {
          layer: layer
        })
        gerberSVGs[layer] = response.data.svg
      } catch (error) {
        console.error(`Error generating SVG for layer ${layer}:`, error)
      }
    }
  }

  return {
    // State
    projects,
    selectedProject,
    gerberData,
    pickPlaceData,
    gerberSVGs,
    loading,
    
    // Methods
    loadProjectData,
    generateLayerSVGs
  }
}