'use strict';

const apiKey = ''; // apiKey from http://www.omdbapi.com
const queryBySearchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&s=`;
const queryByTitleUrl = `http://www.omdbapi.com/?apikey=${apiKey}&t=`;
const form = document.querySelector("form");
const responseDiv = document.querySelector(".queryResults");


form.addEventListener('submit', (e) => {
	e.preventDefault();
	responseDiv.innerHTML = "";
	let inputedTitle = document.querySelector("input").value;
	let escaped = encodeURIComponent(inputedTitle)
	let endpoint = `${queryBySearchUrl}${escaped}`;
	respondToQuery(endpoint);
})


async function respondToQuery(endpoint) {
	try {
		let movies = await findMovies(endpoint);
		if (movies) {
			console.log(movies)
			renderData(movies);
		}
	} catch (err) {
		renderError(err);
	}
}

async function findMovies(endpoint) {
	let results = await fetchUrl(endpoint).then(results => results.Search);
	if (!!results) {
		let movies = await returnMoviesInfos(results);
		return movies
	}
}

async function fetchUrl(endpoint) {
	const response = await fetch(endpoint);

	if (!response.ok) {
		throw new Error('Request Failed');
	}
	const jsonResponse = await response.json()
	if (jsonResponse.Response === 'True') {
		return jsonResponse
	}
	throw jsonResponse.Error; 

}

async function returnMoviesInfos(results) {
	let movies = [];
	const moviePromises = results.map(result => fetchUrl(`${queryByTitleUrl}${result.Title}`));
	const moviePlots = (await Promise.all(moviePromises.map(p => p.catch(e => ({Plot: 'N/A'}))))).map(plotResult => plotResult.Plot);
	for (let i=0; i<results.length; i++) {
		const result = results[i];
		let movie = {};
		movie.title = result.Title;
		movie.year = result.Year;
		movie.posterSrc = result.Poster;
		movie.plot = moviePlots[i];
		movies.push(movie)
	}
	return movies
}


function renderData(movies) {
	let template = document.querySelector("template")
	let movieContainer = template.content.querySelector(".result")
	for (let movie of movies) {
		let result = document.importNode(movieContainer, true)
		let poster = result.querySelector(".poster")
		let title = result.querySelector(".title")
		let year = result.querySelector(".year")
		let plot = result.querySelector(".plot")
		title.innerHTML = movie.title;
		year.innerHTML = movie.year;
		plot.innerHTML = movie.plot;
		if (movie.posterSrc !== "N/A") {
			poster.setAttribute("src", movie.posterSrc);
		}
		responseDiv.appendChild(result);
	}
}

function renderError(error) {
	responseDiv.innerHTML = error;
}

