// Ballpit Animation Setup
let ballpitInstance = null;

function setupBallpitAnimation() {
  const canvas = document.getElementById('ballpitCanvas');
  if (!canvas) return;

  // Ballpit configuration
  const config = {
    count: 150,
    colors: [0x4f46e5, 0x7c3aed, 0xec4899, 0xf59e0b, 0x10b981],
    ambientColor: 0xffffff,
    ambientIntensity: 0.6,
    lightIntensity: 150,
    materialParams: {
      metalness: 0.3,
      roughness: 0.7,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    },
    minSize: 0.3,
    maxSize: 0.8,
    size0: 0.6,
    gravity: 0.4,
    friction: 0.998,
    wallBounce: 0.9,
    maxVelocity: 0.12,
    maxX: 8,
    maxY: 8,
    maxZ: 3,
    controlSphere0: false,
    followCursor: true
  };

  // Initialize Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true, 
    alpha: true 
  });

  // Set renderer properties
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Setup camera
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 0);

  // Setup lighting
  const ambientLight = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, config.lightIntensity);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Create spheres
  const spheres = [];
  const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
  
  for (let i = 0; i < config.count; i++) {
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(config.colors[i % config.colors.length]),
      metalness: config.materialParams.metalness,
      roughness: config.materialParams.roughness,
      clearcoat: config.materialParams.clearcoat,
      clearcoatRoughness: config.materialParams.clearcoatRoughness,
    });

    const sphere = new THREE.Mesh(sphereGeometry, material);
    
    // Random initial position
    sphere.position.set(
      (Math.random() - 0.5) * config.maxX * 2,
      (Math.random() - 0.5) * config.maxY * 2,
      (Math.random() - 0.5) * config.maxZ * 2
    );
    
    // Random size
    const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
    sphere.scale.setScalar(size);
    
    // Add velocity for physics
    sphere.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    
    spheres.push(sphere);
    scene.add(sphere);
  }

  // Mouse interaction
  let mouse = new THREE.Vector2();
  let raycaster = new THREE.Raycaster();
  let isMouseDown = false;
  let selectedSphere = null;

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onMouseDown(event) {
    isMouseDown = true;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);
    if (intersects.length > 0) {
      selectedSphere = intersects[0].object;
    }
  }

  function onMouseUp() {
    isMouseDown = false;
    selectedSphere = null;
  }

  // Add event listeners
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup');
    canvas.dispatchEvent(mouseEvent);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update sphere physics
    spheres.forEach(sphere => {
      // Apply gravity
      sphere.velocity.y -= config.gravity * 0.01;
      
      // Apply friction
      sphere.velocity.multiplyScalar(config.friction);
      
      // Update position
      sphere.position.add(sphere.velocity);
      
      // Boundary collision
      if (Math.abs(sphere.position.x) > config.maxX) {
        sphere.position.x = Math.sign(sphere.position.x) * config.maxX;
        sphere.velocity.x *= -config.wallBounce;
      }
      if (Math.abs(sphere.position.y) > config.maxY) {
        sphere.position.y = Math.sign(sphere.position.y) * config.maxY;
        sphere.velocity.y *= -config.wallBounce;
      }
      if (Math.abs(sphere.position.z) > config.maxZ) {
        sphere.position.z = Math.sign(sphere.position.z) * config.maxZ;
        sphere.velocity.z *= -config.wallBounce;
      }
      
      // Mouse interaction
      if (selectedSphere === sphere && isMouseDown) {
        raycaster.setFromCamera(mouse, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        sphere.position.copy(intersection);
        sphere.velocity.set(0, 0, 0);
      }
    });

    // Render
    renderer.render(scene, camera);
  }

  // Handle resize
  function onResize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(canvas.width, canvas.height);
  }

  window.addEventListener('resize', onResize);
  onResize();

  // Start animation
  animate();

  // Store instance for cleanup
  ballpitInstance = {
    scene,
    camera,
    renderer,
    spheres,
    cleanup: () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onMouseDown);
      canvas.removeEventListener('touchmove', onMouseMove);
      canvas.removeEventListener('touchend', onMouseUp);
      renderer.dispose();
    }
  };
}

// Initialize ballpit animation when page loads
document.addEventListener('DOMContentLoaded', function() {
  setupBallpitAnimation();
  console.log('🎓 StudyBuddy Onboarding - Initializing...');
  initializeOnboarding();
});

// Cleanup Three.js resources when page is unloaded
window.addEventListener('beforeunload', function() {
  if (ballpitInstance) {
    ballpitInstance.cleanup();
  }
});

function initializeOnboarding() {
  console.log('📋 Setting up onboarding form...');
  
  // Setup event listeners
  setupOnboardingEventListeners();
  
  console.log('✅ Onboarding initialized successfully!');
}

function setupOnboardingEventListeners() {
  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }
  
  // Avatar selection
  document.addEventListener('click', function(e) {
    if (e.target.closest('.avatar-option')) {
      e.preventDefault();
      selectAvatar(e);
    }
  });
  
  // Back to home button
  document.addEventListener('click', function(e) {
    if (e.target.closest('#back-to-home')) {
      e.preventDefault();
      console.log('🏠 Back to home clicked');
      window.location.href = 'index.html';
    }
  });
}

function selectAvatar(e) {
  document.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('avatar-selected'));
  e.target.closest('.avatar-option').classList.add('avatar-selected');
}

function handleProfileSubmit(e) {
  e.preventDefault();
  console.log('📋 Profile form submitted');
  
  // Get form data
  const name = document.getElementById('name')?.value.trim();
  const year = document.getElementById('year')?.value;
  const department = document.getElementById('department')?.value;
  const studyStyle = document.getElementById('study_style')?.value;
  const bio = document.getElementById('bio')?.value.trim();
  
  // Validate required fields
  if (!name || !year || !department || !studyStyle) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Get preferred times
  const preferredTimes = Array.from(document.querySelectorAll('input[name="preferred_times"]:checked')).map(cb => cb.value);
  if (preferredTimes.length === 0) {
    alert('Please select at least one preferred study time');
    return;
  }
  
  // Get selected subjects
  const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);
  if (selectedSubjects.length === 0) {
    alert('Please select at least one subject');
    return;
  }
  
  // Get selected avatar
  const selectedAvatar = document.querySelector('.avatar-option.avatar-selected')?.getAttribute('data-avatar') || '👤';
  
  const currentUser = {
    id: Date.now(),
    name: name,
    year: parseInt(year),
    department: department,
    subjects: selectedSubjects,
    preferred_times: preferredTimes,
    study_style: studyStyle,
    avatar: selectedAvatar,
    bio: bio || '',
    location: 'SRM Modinagar, Ghaziabad'
  };
  
  try {
    localStorage.setItem('studyBuddy_user', JSON.stringify(currentUser));
    console.log('✅ User profile saved:', currentUser.name);
    
    // Show success message
    alert('🎉 Profile created successfully! Welcome to StudyBuddy!');
    
    // Redirect to chatbot page
    window.location.href = 'chatbot.html';
  } catch (e) {
    console.error('❌ Error saving user data:', e);
    alert('Error saving profile. Please try again.');
  }
}
