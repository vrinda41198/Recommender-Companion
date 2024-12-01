export interface BaseItem {
    id?: number;
    title: string;
    description: string;
    genre: string;
    type: string;
}

export interface Movie extends BaseItem {
    cast: string[];
    release_year: number;
    type: 'movie';
}

export interface Book extends BaseItem {
    author: string;
    publish_year: number;
    type: 'book';
}

export interface Review {
    itemId: number;
    itemType: 'movie' | 'book';
    rating: number;
    review: string;
}

export interface ApiResponse<T> {
    data: T[];
    total: number;
    page: number;
}

// Type guard functions
export function isMovie(item: Movie | Book): item is Movie {
    return item.type === 'movie';
}

export function isBook(item: Book | Movie): item is Book {
    return item.type === 'book';
}