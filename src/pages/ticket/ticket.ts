import { Component, SimpleChanges, ViewChild, ElementRef, OnChanges } from '@angular/core';

import { NavParams, Segment, Slides, App } from 'ionic-angular';

import { Movie } from "../../core/movie.model";

import moment from 'moment';
import _ from 'lodash';

import { MovieShowtime } from "../../core/movie-showtime.model";
import { MovieService } from "../../core/movie.service";

import { CheckoutPage } from "./../checkout/checkout";
import { CinemaHall } from "../../core/models";
import { CinemaHallSeat } from "../../core/cinema-hall-seat.model";

@Component({
    selector: 'page-ticket',
    templateUrl: "ticket.html"
})
export class TicketPage {

    @ViewChild('datepicker') datepicker: Slides;
    @ViewChild('dateSwiperNext') dateSwiperNext: ElementRef;
    @ViewChild('dateSwiperPrev') dateSwiperPrev: ElementRef;

    public movie: Movie;

    public dates: { id: number, value: moment.Moment }[];
    public selectedDate: moment.Moment;
    public selectedDateId: number;

    public technologies: { id: string, value: string }[];
    public selectedTechId: string;
    public selectedTech: string;

    public times: { id: string, value: moment.Moment, active: boolean, showtime: MovieShowtime }[];
    public selectedTimeId: string;
    public selectedTime: moment.Moment;

    public showtimes: MovieShowtime[];

    public hall: CinemaHall;
    public seats: CinemaHallSeat[];
    public totalPrice: number; //price

    constructor(
        private appCtrl: App,
        private navParams: NavParams,
        private movieService: MovieService) {
    }

    ngOnInit() {
        this.movie = this.navParams.get("movie");

        var seats:CinemaHallSeat[] = [];

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 23; c++) {
                let style = {
                    width: 30,
                    height: 34,
                    marginLeft: 2,
                    marginRight: 2,
                    marginTop: 4,
                    marginBottom: 4
                };

                var seat: CinemaHallSeat = {
                    x: c * (style.width + style.marginLeft + style.marginRight),
                    y: r * (style.height + style.marginBottom + style.marginTop),
                    width: style.width,
                    height: style.height,

                    row: r + 1,
                    seat: c + 1,

                    available: true,

                    price: 115,
                };
                seats.push(seat);
            }

        }

        this.hall = {
            id: 'hall_1',
            seats: seats
        };
        this.seats = [];
    }

    ngAfterViewInit() {
        this.datepicker.nextButton = this.dateSwiperNext.nativeElement;
        this.datepicker.prevButton = this.dateSwiperPrev.nativeElement;
    }

    ionViewWillEnter() {
        this.refreshShowtimes();
    }

    duration(duration: number) {
        var d = moment.duration(duration, "minutes");
        return d.hours() + "h " + d.minutes() + "min";
    }

    refreshShowtimes() {
        this.movieService.getShowtimes().subscribe(res => {
            var showtimes = res.filter(s => s.movieId == this.movie.id);
            this.showtimes = showtimes;

            this.onShowtimesChange();
            return;
        });
    }

    private onShowtimesChange() {
        var dates = _.chain(this.showtimes).map(s => ({
            id: moment(s.time).startOf('date').valueOf(),
            value: s.time,
        })).uniqBy(d => d.id).value();

        this.dates = dates;
        this.selectedDate = this.dates[0].value;
        this.selectedDateId = this.dates[0].id;
        this.onDateChange();
    }

    onDateChange() {
        if (this.dates == null)
            return;

        var selectedDate = this.dates.find(d => d.id == this.selectedDateId);
        this.selectedDate = selectedDate.value;

        var techs = _.chain(this.showtimes)
            .filter(s => s.time.isSame(selectedDate.value, 'day'))
            .map(s => ({
                id: s.techId,
                value: s.techId
            }))
            .uniqBy(t => t.id)
            .value();

        this.technologies = techs;
        this.selectedTechId = this.technologies[0].id;
        this.selectedTech = this.technologies[0].value;
        this.onTechChange();
    }

    onTechChange() {
        try {
            var selectedTech = this.technologies.find(t => t.id == this.selectedTechId);
            this.selectedTech = selectedTech.value;

            console.log(this.selectedDate);

            var now = moment();
            var times = _.chain(this.showtimes)
                .filter(s => s.time.isSame(this.selectedDate, 'day') && s.techId == this.selectedTechId)
                .map(s => ({
                    id: s.time.format("HH:mm") + '_' + s.hallId,
                    active: s.time.isAfter(now),
                    value: s.time,
                    showtime: s
                }))
                .uniqBy(t => t.id)
                .value();
            console.log('filtered', times);

            this.times = times;
            this.selectedTime = null;
            this.selectedTimeId = null;
        }
        catch (err) {

        }
    }

    onTimeChange() {
        if (this.times == null || this.selectedTimeId == null)
            return;

        var selectedTime = this.times.find(t => t.id == this.selectedTimeId);
        this.selectedTime = selectedTime.value;
    }

    checkout() {
        var tickets = [{}, {}];

        this.appCtrl.getRootNav().push(CheckoutPage, {
            movie: this.movie,
            tickets: tickets
        });
    }

    getTotalSum(seats: CinemaHallSeat[]) {
        return _.sumBy(seats, s => s.price);
    }

}