/**
 * Input validation and error handling utilities
 */

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class Validator {
  static validateUserProfile(userProfile) {
    const errors = [];
    
    if (!userProfile) {
      throw new ValidationError('User profile is required');
    }
    
    // Skill level validation
    if (userProfile.skillLevel !== undefined) {
      if (!Number.isInteger(userProfile.skillLevel) || userProfile.skillLevel < 1 || userProfile.skillLevel > 10) {
        errors.push('skillLevel must be an integer between 1 and 10');
      }
    }
    
    // Instrument validation
    const validInstruments = ['guitar', 'piano', 'bass', 'drums', 'violin', 'vocals'];
    if (userProfile.instrument && !validInstruments.includes(userProfile.instrument)) {
      errors.push(`instrument must be one of: ${validInstruments.join(', ')}`);
    }
    
    // Genre preferences validation
    if (userProfile.genrePreferences && !Array.isArray(userProfile.genrePreferences)) {
      errors.push('genrePreferences must be an array');
    }
    
    // Preferred difficulty validation
    if (userProfile.preferredDifficulty) {
      if (!Array.isArray(userProfile.preferredDifficulty)) {
        errors.push('preferredDifficulty must be an array');
      } else {
        const invalidDifficulties = userProfile.preferredDifficulty.filter(d => 
          !Number.isInteger(d) || d < 1 || d > 10
        );
        if (invalidDifficulties.length > 0) {
          errors.push('preferredDifficulty values must be integers between 1 and 10');
        }
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(`User profile validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }
  
  static validateContext(context) {
    const errors = [];
    
    if (!context) {
      throw new ValidationError('Context is required');
    }
    
    // Time of day validation
    const validTimesOfDay = ['morning', 'afternoon', 'evening', 'night'];
    if (context.timeOfDay && !validTimesOfDay.includes(context.timeOfDay)) {
      errors.push(`timeOfDay must be one of: ${validTimesOfDay.join(', ')}`);
    }
    
    // Available time validation
    if (context.availableTime !== undefined) {
      if (!Number.isInteger(context.availableTime) || context.availableTime < 1 || context.availableTime > 300) {
        errors.push('availableTime must be an integer between 1 and 300 minutes');
      }
    }
    
    // Mood validation
    const validMoods = ['happy', 'sad', 'energetic', 'calm', 'stressed', 'motivated', 'tired', 'neutral', 'relaxed'];
    if (context.mood && !validMoods.includes(context.mood)) {
      errors.push(`mood must be one of: ${validMoods.join(', ')}`);
    }
    
    // Goals validation
    const validGoals = ['relax', 'energize', 'challenge', 'maintain', 'learn', 'practice'];
    if (context.goals && !validGoals.includes(context.goals)) {
      errors.push(`goals must be one of: ${validGoals.join(', ')}`);
    }
    
    // Explore new moods validation
    if (context.exploreNewMoods !== undefined && typeof context.exploreNewMoods !== 'boolean') {
      errors.push('exploreNewMoods must be a boolean');
    }
    
    if (errors.length > 0) {
      throw new ValidationError(`Context validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }
  
  static validateSongFilters(filters) {
    const errors = [];
    
    if (!filters || typeof filters !== 'object') {
      return true; // Filters are optional
    }
    
    // Genre validation
    if (filters.genre && typeof filters.genre !== 'string') {
      errors.push('genre must be a string');
    }
    
    // Difficulty validation
    if (filters.difficulty_min !== undefined) {
      if (!Number.isInteger(filters.difficulty_min) || filters.difficulty_min < 1 || filters.difficulty_min > 10) {
        errors.push('difficulty_min must be an integer between 1 and 10');
      }
    }
    
    if (filters.difficulty_max !== undefined) {
      if (!Number.isInteger(filters.difficulty_max) || filters.difficulty_max < 1 || filters.difficulty_max > 10) {
        errors.push('difficulty_max must be an integer between 1 and 10');
      }
    }
    
    // Duration validation
    if (filters.duration_min !== undefined) {
      if (!Number.isInteger(filters.duration_min) || filters.duration_min < 1) {
        errors.push('duration_min must be a positive integer (seconds)');
      }
    }
    
    if (filters.duration_max !== undefined) {
      if (!Number.isInteger(filters.duration_max) || filters.duration_max < 1) {
        errors.push('duration_max must be a positive integer (seconds)');
      }
    }
    
    // Energy level validation
    const validEnergyLevels = ['very_low', 'low', 'medium', 'high', 'very_high', 'variable'];
    if (filters.energy_level && !validEnergyLevels.includes(filters.energy_level)) {
      errors.push(`energy_level must be one of: ${validEnergyLevels.join(', ')}`);
    }
    
    // Limit validation
    if (filters.limit !== undefined) {
      if (!Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 100) {
        errors.push('limit must be an integer between 1 and 100');
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(`Filter validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }
  
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().toLowerCase();
    }
    return input;
  }
  
  static validatePaginationParams(page, limit) {
    const errors = [];
    
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('page must be a positive integer');
      }
    }
    
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push('limit must be an integer between 1 and 100');
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(`Pagination validation failed: ${errors.join(', ')}`);
    }
    
    return {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    };
  }
}

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      field: err.field,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent') || 'Unknown'
    };
    
    console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration})`);
  });
  
  next();
}

module.exports = {
  Validator,
  ValidationError,
  errorHandler,
  requestLogger
};
