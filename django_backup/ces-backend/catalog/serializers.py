from rest_framework import serializers
from .models import Genre, Movie, Showtime, Hall, Seat


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = [
            "genre_id",
            "name",
        ]


class MovieListSerializer(serializers.ModelSerializer):
    genre_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Movie
        fields = [
            "movie_id",
            "title",
            "genre_id",
            "rating",
            "poster_url",
            "status",
        ]


class MovieDetailSerializer(serializers.ModelSerializer):
    genre_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Movie
        fields = [
            "movie_id",
            "title",
            "genre_id",
            "rating",
            "description",
            "poster_url",
            "trailer_url",
            "director",
            "cast_members",
        ]


class ShowtimeSerializer(serializers.ModelSerializer):
    movie_id = serializers.IntegerField(read_only=True)
    hall_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Showtime
        fields = [
            "showtime_id",
            "movie_id",
            "hall_id",
            "show_datetime",
            "available_seats",
        ]


class HallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hall
        fields = [
            "hall_id",
            "hall_name",
            "capacity",
            "total_seats",
        ]


class SeatSerializer(serializers.ModelSerializer):
    hall_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Seat
        fields = [
            "seat_id",
            "hall_id",
            "seat_row",
            "seat_number",
            "status",
        ]