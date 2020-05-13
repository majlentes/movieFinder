import React from 'react';
import './App.css';

const apiKey = ''; // apiKey from http://www.omdbapi.com

function Movie(props) {
  const {posterSrc, title, year, plot} = props;
  return (
    <div className='movie'>
      {
        posterSrc !== 'N/A' &&
        <img src={posterSrc} alt={title}/>
      }
      <div className='movieInfo'>
        <p>Title: {title}</p>
        <p>Year: {year}</p>
        {
          plot !== 'N/A' &&
          <p>Plot: {plot}</p>
        } 
      </div>
    </div>
  )
}

class SearchBar extends React.Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const title = e.target.title.value
    this.props.onSubmit(title)
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input type='text' placeholder='Search title...' name='title'/>
        <input type='submit' value='Search'/>
      </form>
    );
  }
}

class Pagination extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    const currentPage = parseInt(this.props.page)
    if (e.target.className === 'previousPage') {
      this.props.onPageChange(currentPage - 1)
    } else {
      this.props.onPageChange(currentPage + 1)
    }
  }

  render() {
    return (
      <div>
      {
        this.props.page !== 1 &&
        <button className='previousPage' onClick={this.handleClick}> Previous page </button>
      }
        <p> {this.props.page} </p>
        <button className='nextPage' onClick={this.handleClick}> Next page </button>
      </div>
    )
  }
}

class ResultsTable extends React.Component {
  constructor(props) {
    super(props);
    this.handlePageChange = this.handlePageChange.bind(this);
  }

 handlePageChange(newPage) {
    this.props.onPageChange(newPage)
  }

  render() {
    const results = this.props.movies.map((movie) => <Movie title={movie.title} posterSrc={movie.posterSrc} plot={movie.plot} year={movie.year}/>)

    return (
      <div>
        <div> {results} </div>
        <Pagination page={this.props.page} onPageChange={this.handlePageChange} />
      </div>
    );
  }
}

class MovieSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {title: '', 
                  page: 1, 
                  results: null,
                  error: null
                };

    this.handleTitleSubmit = this.handleTitleSubmit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }

  async handleTitleSubmit(searchedTitle) {
    this.setState({
      title: searchedTitle,
      page: 1,
      results: null,
      error: null
    }/*, this.setResults*/);
    this.fetchResults(searchedTitle, '1');
  }

  handlePageChange(newPage) {
    this.setState({
      page: newPage
    }, this.setResults);
    this.fetchResults(this.state.title, newPage);
  }

  fetchResults(title, page) {
    const queryBySearchUrl = 
    `http://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(title)}&page=${page}`;
    if (!!title) {
      respondToQuery(queryBySearchUrl)
      .then(result => this.setState(result));
    }

    async function respondToQuery(endpoint) {
      try {
        let movies = await findMovies(endpoint);
        if (movies) {
          return({results: movies});
        }
      } catch (err) {
        return({error: err});
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
      const queryByTitleUrl = `http://www.omdbapi.com/?apikey=${apiKey}&t=`;
      const moviePromises = results.map(result => fetchUrl(`${queryByTitleUrl}${result.Title}`));
      const moviePlots = (await Promise.all(moviePromises.map(p => p.catch(e => ({Plot: 'N/A'}))))).map(plotResult => plotResult.Plot);
      console.log(results)
      console.log(moviePlots)
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
  }

  render() {
    return (
    <div>
      <SearchBar name='Search' onSubmit={this.handleTitleSubmit}/>
      {
        (!!this.state.results &&
        <ResultsTable movies={this.state.results} page={this.state.page} onPageChange={this.handlePageChange}/>) ||
        <p> {this.state.error} </p>
      }
      
    </div>
    );
  }
}

function App() {
  return (
    <div className='App'>
      <MovieSearch />
    </div>
  );
}

export default App;


