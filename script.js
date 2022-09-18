'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const runIcon = '🏃‍♂️';
const cycleIcon = '🚴‍♀️';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  id = (Date.now() + '').slice(-10);
  date = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  #type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
  }

  get type() {
    return this.#type;
  }
}

class Cycling extends Workout {
  #type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }

  get type() {
    return this.#type;
  }
}

class App {
  map;
  #mapE;
  workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Unable to get the current position.');
        }
      );
    } else {
      alert('Geo location API unavailable.');
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    // Render the map on location using Leaflet
    this.map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Hanlde user click on map
    this.map.on('click', this._showForm.bind(this));
  }

  _showForm(mapEvent) {
    this.#mapE = mapEvent;
    // Show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const areNumbers = (checkPositive, ...inputs) =>
      inputs.every(inp => {
        if (checkPositive) {
          return Number.isFinite(inp) && inp > 0;
        } else {
          return Number.isFinite(inp);
        }
      });

    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapE.latlng;
    let workout;
    let workoutClassName;

    // Create running or cyclcing object based on input
    if (type === 'running') {
      const cadence = +inputCadence.value;
      workoutClassName = 'running-popup';

      // Check if data is valid
      if (
        !areNumbers(true, distance, duration, cadence) ||
        !areNumbers(false, distance, duration, cadence)
      )
        return alert('Inputs need to be positive numbers.');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      workoutClassName = 'cycling-popup';

      // Check if data is valid
      if (
        !areNumbers(true, distance, duration) ||
        !areNumbers(false, elevationGain)
      )
        return alert('Inputs need to be positive numbers.');

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Add new object to workout array
    this.workouts.push(workout);

    // Create a marker for the selected location on the map
    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: workoutClassName,
        })
      )
      .setPopupContent(
        `${type === 'running' ? runIcon : cycleIcon} ${
          workout.constructor.name
        } on ${months[workout.date.getMonth()]} ${workout.date.getDate()}`
      )
      .openPopup();

    // Render workout on map as marker
    this._renderWorkout(workout);
  }

  _renderWorkout(workout) {
    // Hide the workout form
    this._hideForm();

    containerWorkouts.insertAdjacentHTML(
      'afterbegin',
      `<li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.constructor.name} on ${
        months[workout.date.getMonth()]
      } ${workout.date.getDate()}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? runIcon : cycleIcon
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.type === 'running' ? workout.pace : workout.speed
        }</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${
          workout.type === 'running' ? workout.cadence : workout.elevationGain
        }</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`
    );
  }

  _hideForm() {
    // Clear input fileds
    inputDistance.value =
      inputCadence.value =
      inputElevation.value =
      inputDuration.value =
        '';
    form.style.display = 'grid';
    form.classList.add('hidden');
  }
}

const app = new App();
