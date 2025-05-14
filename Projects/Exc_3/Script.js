import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Función para obtener la zona horaria y la hora usando Time Zone DB
async function getTimeZone(lat, lng) {
  const apiKey = "LGX6NIHCT0UJ"; // Tu clave API de Time Zone DB
  const url = `https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${lat}&lng=${lng}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time zone data:", error);
    return null;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyD01tHPd_765l93eqlpAoqv4TT1pL3xQ_Y",
  authDomain: "fbkjd-11429.firebaseapp.com",
  projectId: "fbkjd-11429",
  storageBucket: "fbkjd-11429.firebasestorage.app",
  messagingSenderId: "116123213287",
  appId: "1:116123213287:web:d394f0c367689ab1b2b142",
  measurementId: "G-TPV1832LKN",
};
export { firebaseConfig };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

/*--Declarar variables--*/
let map;
let markers = [];
let mapMarker = false;
let interesLocations = false;
let interesMarkers = [];
let directionsService;
let directionsRenderer;
let manualMarkerPosition = null;
let currentInfoWindow = null;
let routeVisible = true;
let favoriteIcons = [];
const MAX_FAVORITES = 6;
const { AddvancedMarkerElement } = await google.maps.importLibrary("marker");
const dialog = document.querySelector(".popup");

const lat = document.getElementById("latitude");
const lng = document.getElementById("longitude");
const zoomInput = document.getElementById("zoomInput");
const buttonSet = document.getElementById("buttonSet");
const locationSelect = document.getElementById("locationSelect");
const iconSelect = document.getElementById("iconSelect");
const iconImage = document.getElementById("iconImage");
const popupLatitude = document.querySelector("#inpLatitude");
const popupLongitude = document.querySelector("#inpLongitude");
const pupopButton = document.querySelector("#pupopButton");
const inputPlace = document.querySelector("#placeName");
const smallWarning = document.querySelector("#warning");
const timeZone = document.querySelector("#timeZone");
const currentTime = document.querySelector("#currentTime");
const labTimeZone = document.querySelector("#labTimeZone");
const intLocations = document.querySelector("#intLocations");
const durationTimer = document.querySelector("#duration");
const hideIcons = document.querySelector("#hideIcons");
const pupopCloseButton = document.querySelector("#pupopCloseButton");
const landingPage = document.querySelector("#landingPage");
const noLog = document.querySelector("#noLog");
const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const signupForm = document.querySelector(".registration.form");
const loginForm = document.querySelector(".login.form");
const forgotForm = document.querySelector(".forgot.form");
const container = document.querySelector(".container");
const signupBtn = document.querySelector(".signupbtn");
const anchors = document.querySelectorAll("a");
const toggleButtons = document.querySelectorAll(".toggle-password");
const favoriteSelect = document.getElementById("favoriteSelect");
const userActive = document.querySelector("#userActive");
const signoutBtn = document.querySelector("#signoutbtn");

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User authenticated:", user.email);
    landingPage.close();
    loadFavoritesFromFirestore();
  } else {
    console.log("User not authenticated");
    favoriteIcons = [];
    updateFavoriteSelect();
  }
  changeUser();
});

const icons = [
  {
    iconName: "Select an icon",
    src: "",
    despciption: "",
  },
];

let locations = [
  {
    place: "Select place",
    lat: "",
    lng: "",
  },
];

locations.forEach((location, i) => {
  let opt = document.createElement("option");
  opt.value = i;
  opt.innerHTML = location.place;
  locationSelect.appendChild(opt);
});

icons.forEach((icon, i) => {
  let opt = document.createElement("option");
  opt.value = i;
  opt.innerHTML = icon.iconName;
  iconSelect.appendChild(opt);
});

/*-uso de la funcion-*/
function setLocations() {
  let x1 = locationSelect.value;
  lat.value = locations[x1].lat;
  lng.value = locations[x1].lng;

  const y1 = {
    lat: parseFloat(lat.value),
    lng: parseFloat(lng.value),
  };
  map.setCenter(y1);
}

async function loadPokemonSprites() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
    const data = await response.json();

    for (const pokemon of data.results) {
      const pokemonData = await fetch(pokemon.url).then((res) => res.json());

      icons.push({
        iconName:
          pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
        src: pokemonData.sprites.front_default,
        description: `Pokémon ${pokemonData.id}: ${pokemonData.name}`,
        id: pokemonData.id,
      });
    }

    updateIconSelect();
    loadFavoritesFromFirestore();
  } catch (error) {
    console.error("Error loading Pokémon sprites:", error);
  }
}

function updateIconSelect() {
  iconSelect.innerHTML = "";

  icons.forEach((icon, i) => {
    let opt = document.createElement("option");
    opt.value = i;
    opt.innerHTML = icon.iconName;
    iconSelect.appendChild(opt);
  });
}

async function loadLocationsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "locations"));

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        place: data.placename,
        lat: data.lat.toString(),
        lng: data.lng.toString(),
      });
    });

    const staticLocations = [
      {
        place: "UTLD",
        lat: "25.501762794398427",
        lng: "-103.55174782656077",
      },
      {
        place: "TEC LERDO",
        lat: "25.552014736025964",
        lng: "-103.53654932166197",
      },
      {
        place: "UNI POLI NVV",
        lat: "24.022364974692273",
        lng: "-104.55388810430193",
      },
      {
        place: "Casa del Rodo",
        lat: "25.49985580365439",
        lng: "-103.5479657060881",
      },
    ];

    locations = [...locations, ...staticLocations];

    // Actualiza el select con los nuevos lugares
    updateLocationSelect();
  } catch (error) {
    console.error("Error loading locations from Firestore: ", error);
  }
}

function updateLocationSelect() {
  locationSelect.innerHTML = "";

  locations.forEach((location, i) => {
    let opt = document.createElement("option");
    opt.value = i;
    opt.innerHTML = location.place;
    locationSelect.appendChild(opt);
  });
}

function setCoordinates() {
  const x1 = {
    lat: parseFloat(lat.value),
    lng: parseFloat(lng.value),
  };

  let zoom = parseInt(zoomInput.value);
  console.log(zoom);
  map.setCenter(x1);
  map.setZoom(zoom);
}

function addMarker(location) {
  const selectedIcon = icons[parseInt(iconSelect.value)];

  const STANDARD_SIZE = 65;

  const ANCHOR_POINT_X = STANDARD_SIZE / 2;
  const ANCHOR_POINT_Y = STANDARD_SIZE * 0.8;

  const image = {
    url: selectedIcon.src,
    scaledSize: new google.maps.Size(STANDARD_SIZE, STANDARD_SIZE),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(ANCHOR_POINT_X, ANCHOR_POINT_Y),
    optimized: false,
  };

  const marker = new google.maps.Marker({
    map,
    position: location,
    icon: image,
    title: selectedIcon.description || selectedIcon.iconName,
  });

  markers.push(marker);
  manualMarkerPosition = location;
}

function toggleFavorite(iconIndex) {
  const icon = icons[iconIndex];
  if (!icon) return;

  // Verificar si ya es favorito
  const existingIndex = favoriteIcons.findIndex((fav) => fav.id === icon.id);

  if (existingIndex >= 0) {
    // Eliminar de favoritos
    favoriteIcons.splice(existingIndex, 1);
  } else {
    // Verificar límite de favoritos
    if (favoriteIcons.length >= MAX_FAVORITES) {
      alert(`You can only add ${MAX_FAVORITES} favorite Pokémon`);
      return;
    }
    // Agregar a favoritos
    favoriteIcons.push(icon);
  }

  updateFavoriteSelect();
  saveFavoritesToFirestore();
}

function updateFavoriteSelect() {
  favoriteSelect.innerHTML = '<option value="-1">Select a favorite</option>';

  favoriteIcons.forEach((icon, index) => {
    let opt = document.createElement("option");
    opt.value = index;
    opt.innerHTML = icon.iconName;
    favoriteSelect.appendChild(opt);
  });
}

async function saveFavoritesToFirestore() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await firestore
      .collection("userFavorites")
      .doc(user.uid)
      .set({
        favorites: favoriteIcons.map((icon) => icon.id),
      });
    console.log("Favorites saved in the Firestore");
  } catch (error) {
    console.error("Error saving favorites :", error);
  }
}

async function loadFavoritesFromFirestore() {
  const user = auth.currentUser;
  if (!user) {
    favoriteIcons = [];
    updateFavoriteSelect();
    return;
  }

  try {
    const doc = await firestore.collection("userFavorites").doc(user.uid).get();
    if (doc.exists) {
      const data = doc.data();

      favoriteIcons = data.favorites
        .map((id) => icons.find((icon) => icon.id === id))
        .filter((icon) => icon);
      updateFavoriteSelect();
      console.log("Favorites loaded from Firestore");
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
  }
}

async function addInfo(location) {
  lat.value = location.lat();
  lng.value = location.lng();

  // Obtener la zona horaria y la hora actual usando Time Zone DB
  const timeZoneData = await getTimeZone(location.lat(), location.lng());

  // Mostrar la zona horaria y la hora en el input labTimeZone
  if (timeZoneData && timeZoneData.zoneName) {
    const formattedTime = timeZoneData.formatted
      ? new Date(timeZoneData.formatted).toLocaleString()
      : "Unknown"; // Formatear la hora

    // Combinar la zona horaria y la hora en una sola cadena
    const timeZoneInfo = `${timeZoneData.zoneName}, ${formattedTime}`;

    labTimeZone.value = timeZoneInfo;
  } else {
    labTimeZone.value = "Zona Horaria: Unknown, Hora Actual: Unknown";
  }
}

async function addDB(location) {
  const selectedIcon = icons[parseInt(iconSelect.value)];
  const STANDARD_SIZE = 40;

  const coords = {
    lat: location.lat,
    lng: location.lng,
    placename: location.placename,
    timeZone: location.timeZone,
    currentTime: location.currentTime,
    iconName: selectedIcon.iconName,
    marker: {
      url: selectedIcon.src,
      size: {
        width: STANDARD_SIZE,
        height: STANDARD_SIZE,
      },
      origin: { x: 0, y: 0 },
      anchor: {
        x: STANDARD_SIZE / 2,
        y: STANDARD_SIZE / 2,
      },
    },
  };

  console.log(coords);
  addDoc(collection(db, "locations"), coords)
    .then(() => {
      console.log("Coordinates stored in firestore");
      addMarker(coords);
    })
    .catch((error) =>
      console.error("Error storing coordinates in firestore", error)
    );
}
async function getNearbyPlaces(lat, lng) {
  const apiKey = "fsq3AjVi/0SNZmD7I/TwreuHCTCqvvyRUNb2S/4WxPvxrkw=";
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&limit=10&fields=name,geocodes,location,photos`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results; // Devuelve la lista de lugares cercanos
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return null;
  }
}

async function showNearbyPlaces(lat, lng) {
  if (!interesLocations) return;

  const showMarker = {
    url: "./images/interest.png",
    size: new google.maps.Size(92, 92),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 12),
  };
  const places = await getNearbyPlaces(lat, lng);

  if (places && places.length > 0) {
    places.forEach((place) => {
      const marker = new google.maps.Marker({
        position: {
          lat: place.geocodes.main.latitude,
          lng: place.geocodes.main.longitude,
        },
        map: map,
        title: place.name,
        icon: showMarker,
      });

      interesMarkers.push(marker);

      marker.addListener("click", () => {
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }

        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
      });

      marker.addListener("contextmenu", () => {
        if (manualMarkerPosition) {
          calculateAndDisplayRoute(manualMarkerPosition, marker.getPosition());
        } else {
          console.error("No se ha colocado un marcador manual en el mapa.");
        }
      });

      const photoUrl =
        place.photos && place.photos.length > 0
          ? `${place.photos[0].prefix}300x300${place.photos[0].suffix}`
          : null;

      // Crear el contenido del InfoWindow
      const content = `
        <strong>${place.name}</strong><br>
        ${place.location.address || "Dirección no disponible"}<br>
        ${
          photoUrl
            ? `<img src="${photoUrl}" alt="${place.name}" style="width:100%;max-width:200px;">`
            : ""
        }
      `;

      // Agregar un infoWindow para mostrar detalles del lugar
      const infoWindow = new google.maps.InfoWindow({
        content: content,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  } else {
    console.log("No se encontraron lugares cercanos.");
  }
}

function calculateAndDisplayRoute(origin, destination) {
  const request = {
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING,
  };

  // Calcular la ruta
  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setMap(routeVisible ? map : null);
      directionsRenderer.setDirections(result);

      const route = result.routes[0];
      const leg = route.legs[0];
      const duration = leg.duration.text;
      const distance = leg.distance.text;

      durationTimer.innerText =
        "Tiempo de llegada: " + duration + "\nDistancia: " + distance;
    } else {
      console.error("Error al calcular la ruta:", status);
    }
  });
}

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");

  /*-coordenadas de mapa por defecto-*/
  map = new Map(document.getElementById("map"), {
    center: { lat: 25.501584265759714, lng: -103.551286103138 },
    zoom: 16,
  });

  await loadLocationsFromFirestore();

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

  async function showPopup(location) {
    popupLatitude.value = location.lat();
    popupLongitude.value = location.lng();

    // Obtener la zona horaria y la hora actual usando Time Zone DB
    const timeZoneData = await getTimeZone(location.lat(), location.lng());

    // Mostrar la zona horaria en el popup
    if (timeZoneData && timeZoneData.zoneName) {
      timeZone.value = timeZoneData.zoneName;

      // Mostrar la hora actual en el popup
      if (timeZoneData.formatted) {
        const formattedTime = new Date(timeZoneData.formatted).toLocaleString();
        currentTime.value = formattedTime;
      } else {
        currentTime.value = "Unknown";
      }
    } else {
      timeZone.value = "Unknown";
      currentTime.value = "Unknown";
    }

    // Mostrar el popup
    dialog.showModal();
  }

  map.addListener("click", async (e) => {
    console.log("Click en el mapa:", e.latLng);

    if (interesLocations) {
      await showNearbyPlaces(e.latLng.lat(), e.latLng.lng());
    }

    addMarker(e.latLng);
    addInfo(e.latLng);

    const coords = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
  });

  map.addListener("contextmenu", function (e) {
    console.log("Funciona el click derecho en el mapa");
    console.log(e.latLng);

    showPopup(e.latLng);
    addInfo(e.latLng);
    addMarker(e.latLng);

    const coords = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
  });
}

function setImage() {
  const selectedIcon = icons[parseInt(iconSelect.value)];
  iconImage.src = selectedIcon.src;

  // Ajustes para mostrar correctamente en el selector
  iconImage.style.width = "48px";
  iconImage.style.height = "48px";
  iconImage.style.objectFit = "contain";
  iconImage.style.imageRendering = "pixelated"; // Mantiene calidad de sprites pixelados
}
function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function clearIntMarkers() {
  interesMarkers.forEach((marker) => marker.setMap(null));
  interesMarkers = [];
}

function clearLastMarker() {
  if (markers.length > 0) {
    const lastMarker = markers[markers.length - 1];
    lastMarker.setMap(null);
    markers.pop();

    console.log("Último marcador eliminado.");
  }
}

function changeUser() {
  const user = auth.currentUser;
  const userIcon = '<i class="bi bi-person-circle"></i> ';

  if (!user) {
    if (userActive) {
      userActive.innerHTML = userIcon + "No user";
      signoutBtn.innerHTML = userIcon + "Log in";
    }
    return;
  } else {
    signoutBtn.innerHTML = userIcon + "Sign out";
    firestore
      .collection("users")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists && userActive) {
          const username = doc.data().username || "No user";
          userActive.innerHTML = userIcon + username;
        }
      })
      .catch((error) => {
        console.error("Error obtaining username:", error);
        if (userActive) userActive.innerHTML = userIcon + "No user";
      });
  }
}
/*-funcion del boton-*/
buttonSet.addEventListener("click", setCoordinates);
locationSelect.addEventListener("change", setLocations);
iconSelect.addEventListener("change", setImage);

pupopButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (inputPlace.value.length == 0) {
    smallWarning.textContent = "Empty data!";
  } else {
    let data = {
      lat: parseFloat(popupLatitude.value),
      lng: parseFloat(popupLongitude.value),
      placename: inputPlace.value,
      timeZone: timeZone.value,
      currentTime: currentTime.value,
    };

    const position = { lat: popupLatitude.value, lng: popupLongitude.value };

    addDB(data);
    dialog.close();
    smallWarning.textContent = null;
  }
});

pupopCloseButton.addEventListener("click", (e) => {
  e.preventDefault();
  inputPlace.removeAttribute("required");

  dialog.close();
  clearLastMarker();
  setTimeout(() => {
    inputPlace.setAttribute("required", true);
  }, 0);
});

intLocations.addEventListener("click", () => {
  interesLocations = !interesLocations;

  intLocations.textContent = interesLocations
    ? "Hide interest locations"
    : "See interest locations";

  if (interesLocations) {
    intLocations.classList.add("btn-active");
  } else {
    intLocations.classList.remove("btn-active");
  }

  if (!interesLocations) {
    clearIntMarkers();
  }
});

hideIcons.addEventListener("click", () => {
  if (!mapMarker) {
    clearMarkers();
  }
  routeVisible = !routeVisible;
  directionsRenderer.setMap(routeVisible ? map : null);
});

async function loadMarkersFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "locations"));
    const STANDARD_SIZE = 65;
    const ANCHOR_POINT_Y = STANDARD_SIZE * 0.8; // Ajuste especial para Pokémon

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const position = { lat: data.lat, lng: data.lng };

      // Configuración especial para Pokémon
      const isPokemon = data.marker.url.includes("pokemon");
      const anchorY = isPokemon ? ANCHOR_POINT_Y : STANDARD_SIZE / 2;

      const marker = new google.maps.Marker({
        position,
        map,
        icon: {
          url: data.marker.url,
          scaledSize: new google.maps.Size(STANDARD_SIZE, STANDARD_SIZE), // Usar scaledSize
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(STANDARD_SIZE / 2, anchorY), // Ajuste vertical
          optimized: false, // Importante para sprites pequeños
        },
        title: data.placename,
      });

      let infoContent;
      if (data.iconName) {
        infoContent = `
    <div style="text-align:center;">
      <h2 style="color:#e53935;margin-bottom:5px;">${data.iconName}</h2>
      <img src="${data.marker.url}" 
           alt="${data.iconName}" 
           style="width:96px;height:96px;image-rendering:pixelated;">
      <h3><strong>Ubicación:</strong> ${data.placename}</h3>
      <p><strong>Coordenadas:</strong> ${data.lat}, ${data.lng}</p>
      ${
        data.timeZone
          ? `<p><strong>Zona horaria:</strong> ${data.timeZone}</p>`
          : ""
      }
    </div>
  `;
      } else {
        infoContent = `
          <div style="max-width:250px;">
            <h3 style="color:#1e88e5;margin-bottom:5px;">${data.placename}</h3>
            ${
              data.timeZone
                ? `<p><strong>Zona horaria:</strong> ${data.timeZone}</p>`
                : ""
            }
            ${
              data.currentTime
                ? `<p><strong>Hora local:</strong> ${data.currentTime}</p>`
                : ""
            }
            <p><strong>Coordenadas:</strong> ${data.lat}, ${data.lng}</p>
          </div>
        `;
      }

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener("click", () => {
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
      });

      markers.push(marker);
    });

    console.log("Marcadores cargados correctamente desde Firestore");
  } catch (error) {
    console.error("Error al cargar marcadores desde Firestore:", error);
  }
}

function landDialog() {
  landingPage.showModal();
  noLog.addEventListener("click", (e) => {
    e.preventDefault();
    landingPage.close();
    auth.signOut();
  });
}

/*                          Sign-in/out functions                       */

anchors.forEach((anchor) => {
  anchor.addEventListener("click", () => {
    const id = anchor.id;
    switch (id) {
      case "loginLabel":
        signupForm.style.display = "none";
        loginForm.style.display = "block";
        forgotForm.style.display = "none";
        break;
      case "signupLabel":
        signupForm.style.display = "block";
        loginForm.style.display = "none";
        forgotForm.style.display = "none";
        break;
      case "forgotLabel":
        signupForm.style.display = "none";
        loginForm.style.display = "none";
        forgotForm.style.display = "block";
        break;
    }
  });
});
signupBtn.addEventListener("click", () => {
  const name = document.querySelector("#name").value;
  const username = document.querySelector("#username").value;
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const uid = user.uid;
      user
        .sendEmailVerification()
        .then(() => {
          alert(
            "Verification email sent. Please check your inbox and verify your email before signing in."
          );
        })
        .catch((error) => {
          alert("Error sending verification email: " + error.message);
        });
      console.log("User data saved to Firestore");
      firestore.collection("users").doc(uid).set({
        name: name,
        username: username,
        email: email,
      });
      signupForm.style.display = "none";
      loginForm.style.display = "block";
      forgotForm.style.display = "none";
    })
    .catch((error) => {
      alert("Error signing up: " + error.message);
    });
});
const loginBtn = document.querySelector(".loginbtn");
loginBtn.addEventListener("click", () => {
  const email = document.querySelector("#inUsr").value.trim();
  const password = document.querySelector("#inPass").value;
  auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.emailVerified) {
        console.log("User is signed in with a verified email.");
        landingPage.close();
        changeUser();
      } else {
        alert("Please verify your email before signing in.");
      }
    })
    .catch((error) => {
      alert("Error signing in: " + error.message);
    });
});
const forgotBtn = document.querySelector(".forgotbtn");
forgotBtn.addEventListener("click", () => {
  const emailForReset = document.querySelector("#forgotinp").value.trim();
  if (emailForReset.length > 0) {
    auth
      .sendPasswordResetEmail(emailForReset)
      .then(() => {
        alert(
          "Password reset email sent. Please check your inbox to reset your password."
        );
        signupForm.style.display = "none";
        loginForm.style.display = "block";
        forgotForm.style.display = "none";
      })
      .catch((error) => {
        alert("Error sending password reset email: " + error.message);
      });
  }
});

signoutBtn.addEventListener("click", () => {
  auth
    .signOut()
    .then(() => {
      console.log("User signed out successfully");
      location.href = "index.html";
    })
    .catch((error) => {
      alert("Error signing out: ", error);
    });
});

function togglePassword(event) {
  const button = event.currentTarget;
  const passwordInput = button.previousElementSibling;
  const icon = button.querySelector("i");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.classList.replace("bi-eye-fill", "bi-eye-slash-fill");
  } else {
    passwordInput.type = "password";
    icon.classList.replace("bi-eye-slash-fill", "bi-eye-fill");
  }
}

toggleButtons.forEach((button) => {
  button.addEventListener("click", togglePassword);
});

document.getElementById("toggleFavoriteBtn").addEventListener("click", () => {
  const selectedIndex = parseInt(iconSelect.value);
  if (selectedIndex > 0) {
    toggleFavorite(selectedIndex);
    const isFavorite = favoriteIcons.some(
      (fav) => fav.iconName === icons[selectedIndex].iconName
    );
    document
      .getElementById("toggleFavoriteBtn")
      .classList.toggle("active", isFavorite);
  }
});

document.getElementById("useFavoriteBtn").addEventListener("click", () => {
  const selectedIndex = parseInt(favoriteSelect.value);
  if (selectedIndex >= 0 && favoriteIcons[selectedIndex]) {
    const iconIndex = icons.findIndex(
      (icon) => icon.iconName === favoriteIcons[selectedIndex].iconName
    );
    if (iconIndex >= 0) {
      iconSelect.value = iconIndex;
      setImage();
    }
  }
});

iconSelect.addEventListener("change", () => {
  const selectedIndex = parseInt(iconSelect.value);
  if (selectedIndex > 0) {
    const isFavorite = favoriteIcons.some(
      (fav) => fav.iconName === icons[selectedIndex].iconName
    );
    document
      .getElementById("toggleFavoriteBtn")
      .classList.toggle("active", isFavorite);
  }
});

initMap()
  .then(landDialog)
  .then(loadMarkersFromFirestore)
  .then(loadPokemonSprites);
