import React, { useEffect, useState } from "react";
import "./index.css";
import PokemonCards from "./PokemonCards";

export const Pokemon = ({ onPlayGame }) => {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pokemonPerPage] = useState(12);
  const API = "https://pokeapi.co/api/v2/pokemon?limit=151";

  const fetchPokemon = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();

      const detailedPokemon = data.results.map(async (currPokemon) => {
        const res = await fetch(currPokemon.url);
        const data = await res.json();
        return data;
      });
      const detailedResponse = await Promise.all(detailedPokemon);
      console.log(detailedResponse);
      setPokemon(detailedResponse);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      setError(error);
    }
  };

  useEffect(() => {
    fetchPokemon();
  }, []);

  const searchData = pokemon.filter((currPokemon) =>
    currPokemon.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLastPokemon = currentPage * pokemonPerPage;
  const indexOfFirstPokemon = indexOfLastPokemon - pokemonPerPage;
  const currentPokemon = searchData.slice(indexOfFirstPokemon, indexOfLastPokemon);
  const totalPages = Math.ceil(searchData.length / pokemonPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="pokeball-loader">
          <div className="pokeball">
            <div className="pokeball-inner"></div>
          </div>
        </div>
        <h2>Loading Pokemon...</h2>
        <p>Catching them all for you!</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error.message}</p>
        <button className="retry-button" onClick={fetchPokemon}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Pokemon</span>
            <span className="highlight-text">Explorer</span>
          </h1>
          <p className="hero-subtitle">
            Discover, explore, and battle with your favorite Pokemon!
          </p>
          <div className="hero-actions">
            <button className="play-game-button" onClick={onPlayGame}>
              <span className="button-icon">⚔️</span>
              Start Battle Arena
              <span className="button-subtitle">Challenge the Pokemon Master!</span>
            </button>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="floating-pokeball"></div>
          <div className="floating-pokeball delayed"></div>
          <div className="floating-pokeball slow"></div>
        </div>
      </div>

      <section className="container">
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search Pokemon by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
              {search && (
                <button className="clear-search" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="search-results-info">
            {search ? (
              <p>Found {searchData.length} Pokemon matching "{search}"</p>
            ) : (
              <p>Showing {pokemon.length} Pokemon</p>
            )}
          </div>
        </div>

        <div className="pokemon-grid-container">
          {currentPokemon.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No Pokemon found</h3>
              <p>Try searching with a different name</p>
              <button className="clear-search-button" onClick={clearSearch}>
                Show All Pokemon
              </button>
            </div>
          ) : (
            <>
              <ul className="cards">
                {currentPokemon.map((currPokemon) => {
                  return (
                    <PokemonCards key={currPokemon.id} pokemonData={currPokemon} />
                  );
                })}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`pagination-number ${
                              currentPage === pageNumber ? 'active' : ''
                            }`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 3 ||
                        pageNumber === currentPage + 3
                      ) {
                        return <span key={pageNumber} className="pagination-dots">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};