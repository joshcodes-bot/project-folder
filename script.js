// --- 1. INITIALIZE FIREBASE ---
// PASTE your own `firebaseConfig` object that you copied from the Firebase console
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGMNJk7l0nYOffy99aEvp39MZc9DVy7aA",
  authDomain: "pool-scores-2a41d.firebaseapp.com",
  projectId: "pool-scores-2a41d",
  storageBucket: "pool-scores-2a41d.firebasestorage.app",
  messagingSenderId: "230924224909",
  appId: "1:230924224909:web:f366b63c4ea5846fc355c4",
  measurementId: "G-M3DMHVL7VY"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const playersCollection = db.collection('players');


// --- 2. GET HTML ELEMENTS ---
const leaderboardBody = document.getElementById('leaderboard-body');
const logGameBtn = document.getElementById('log-game-btn');
const gameModal = document.getElementById('game-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const playerSelect = document.getElementById('player-select');
const newPlayerNameInput = document.getElementById('new-player-name');
const winBtn = document.getElementById('win-btn');
const lossBtn = document.getElementById('loss-btn');


// --- 3. CORE FUNCTIONS ---

// Function to fetch players and display them
async function renderLeaderboard() {
    // Get players from Firestore, ordered by wins descending
    const snapshot = await playersCollection.orderBy('wins', 'desc').get();
    
    leaderboardBody.innerHTML = ''; // Clear existing table
    let rank = 1;

    if (snapshot.empty) {
        leaderboardBody.innerHTML = '<tr><td colspan="4">No players yet. Log a game to start!</td></tr>';
        return;
    }

    snapshot.forEach(doc => {
        const player = doc.data();
        player.id = doc.id; // Store document ID for updates

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rank}</td>
            <td>${player.name}</td>
            <td>${player.wins}</td>
            <td>${player.losses}</td>
        `;
        leaderboardBody.appendChild(row);
        rank++;
    });

    // Also update the player selection dropdown for the modal
    populatePlayerSelect(snapshot.docs);
}

// Function to populate the player dropdown in the modal
function populatePlayerSelect(playerDocs) {
    playerSelect.innerHTML = '<option value="new">-- Add New Player --</option>'; // Reset
    playerDocs.forEach(doc => {
        const player = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = player.name;
        playerSelect.appendChild(option);
    });
}

// Function to handle adding a new player
async function addNewPlayer(name) {
    // Check if player already exists (case-insensitive)
    const querySnapshot = await playersCollection.where('name_lowercase', '==', name.toLowerCase()).get();
    if (!querySnapshot.empty) {
        alert("A player with this name already exists.");
        return null;
    }
    const newPlayer = {
        name: name,
        name_lowercase: name.toLowerCase(), // for case-insensitive check
        wins: 0,
        losses: 0,
    };
    const docRef = await playersCollection.add(newPlayer);
    return docRef.id; // Return the new player's ID
}

// Function to update a player's score
async function updateScore(playerId, result) {
    const playerRef = playersCollection.doc(playerId);
    if (result === 'win') {
        await playerRef.update({ wins: firebase.firestore.FieldValue.increment(1) });
    } else if (result === 'loss') {
        await playerRef.update({ losses: firebase.firestore.FieldValue.increment(1) });
    }
}


// --- 4. EVENT LISTENERS ---

// Open the modal
logGameBtn.addEventListener('click', () => {
    gameModal.classList.remove('hidden');
    newPlayerNameInput.classList.add('hidden'); // Hide by default
    playerSelect.value = 'new'; // Reset to default
});

// Close the modal
closeModalBtn.addEventListener('click', () => {
    gameModal.classList.add('hidden');
});

// Show new player input if "Add New Player" is selected
playerSelect.addEventListener('change', () => {
    if (playerSelect.value === 'new') {
        newPlayerNameInput.classList.remove('hidden');
    } else {
        newPlayerNameInput.classList.add('hidden');
    }
});

// Handle win/loss submission
async function handleGameLog(result) {
    let playerId = playerSelect.value;
    const newPlayerName = newPlayerNameInput.value.trim();

    // Check for validation
    if (playerId === 'new' && newPlayerName === '') {
        alert('Please enter a name for the new player.');
        return;
    }

    try {
        // If it's a new player, create them first
        if (playerId === 'new') {
            playerId = await addNewPlayer(newPlayerName);
            if (!playerId) return; // Stop if player creation failed (e.g., name exists)
        }

        // Update the score for the selected or newly created player
        await updateScore(playerId, result);

        // Close modal and refresh the leaderboard
        gameModal.classList.add('hidden');
        await renderLeaderboard();

    } catch (error) {
        console.error("Error logging game: ", error);
        alert("There was an error saving the score.");
    }
}

winBtn.addEventListener('click', () => handleGameLog('win'));
lossBtn.addEventListener('click', () => handleGameLog('loss'));

// --- 5. INITIAL LOAD ---
// Load the leaderboard for the first time when the page loads
document.addEventListener('DOMContentLoaded', renderLeaderboard);