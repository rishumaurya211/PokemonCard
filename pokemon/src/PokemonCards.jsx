import React, { useState } from "react";

const PokemonCards = ({ pokemonData }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getTypeColor = (type) => {
    const typeColors = {
      fire: '#FF6B6B',
      water: '#4ECDC4', 
      grass: '#4CAF50',
      electric: '#FFD93D',
      psychic: '#FF6B9D',
      ice: '#74C0FC',
      dragon: '#8B5CF6',
      dark: '#495057',
      fairy: '#FFB3BA',
      poison: '#9C88FF',
      ground: '#F4A460',
      flying: '#87CEEB',
      bug: '#90EE90',
      rock: '#D2B48C',
      ghost: '#DDA0DD',
      steel: '#B0C4DE',
      fighting: '#FF7F7F',
      normal: '#D3D3D3'
    };
    return typeColors[type.toLowerCase()] || '#6c757d';
  };

  const formatStat = (value) => {
    return value.toString().padStart(3, '0');
  };

  const getMainType = () => {
    return pokemonData.types[0].type.name;
  };

  return (
    <li className="pokemon-card" data-type={getMainType()}>
      <div className="pokemon-card-inner">
        {/* Pokemon ID Badge */}
        <div className="pokemon-id">#{pokemonData.id.toString().padStart(3, '0')}</div>
        
        {/* Pokemon Image */}
        <figure className="pokemon-image-container">
          {!imageLoaded && !imageError && (
            <div className="image-loading">
              <div className="pokeball-spinner"></div>
            </div>
          )}
          
          <img
            src={pokemonData.sprites?.other?.dream_world?.front_default || 
                 pokemonData.sprites?.other?.['official-artwork']?.front_default ||
                 pokemonData.sprites?.front_default ||
                 pokemonData.sprites?.other?.['home']?.front_default}
            alt={pokemonData.name}
            className={`pokemon-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          
          {imageError && (
            <div className="image-fallback">
              <span>🔍</span>
              <p>Image not available</p>
            </div>
          )}
        </figure>

        {/* Pokemon Name */}
        <h2 className="pokemon-name">{pokemonData.name}</h2>

        {/* Pokemon Types */}
        <div className="pokemon-types">
          {pokemonData.types.map((currType, index) => (
            <span 
              key={index}
              className="type-badge"
              style={{ backgroundColor: getTypeColor(currType.type.name) }}
            >
              {currType.type.name}
            </span>
          ))}
        </div>

        {/* Pokemon Stats Grid */}
        <div className="pokemon-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Height</span>
              <span className="stat-value">{(pokemonData.height / 10).toFixed(1)}m</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Weight</span>
              <span className="stat-value">{(pokemonData.weight / 10).toFixed(1)}kg</span>
            </div>
          </div>
          
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Speed</span>
              <span className="stat-value">{formatStat(pokemonData.stats[5].base_stat)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attack</span>
              <span className="stat-value highlight">{formatStat(pokemonData.stats[1].base_stat)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pokemon-additional">
          <div className="info-item">
            <span className="info-label">Experience</span>
            <span className="info-value">{pokemonData.base_experience || 'Unknown'}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Ability</span>
            <span className="info-value">
              {pokemonData.abilities
                .slice(0, 1)
                .map((abilityInfo) => abilityInfo.ability.name)
                .join(", ")}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="card-footer">
          <div className="power-level">
            <span>Power Level</span>
            <div className="power-bar">
              <div 
                className="power-fill" 
                style={{ 
                  width: `${Math.min((pokemonData.stats[1].base_stat / 150) * 100, 100)}%`,
                  backgroundColor: getTypeColor(getMainType())
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default PokemonCards;