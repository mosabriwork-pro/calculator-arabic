import { calcIdealWeight, calcProtein } from '../calculator';
import { Position } from '../constants';

describe('calcIdealWeight', () => {
  it('Goalkeeper', () => {
    expect(calcIdealWeight(180, Position.Goalkeeper)).toEqual({ min: 75, max: 82 });
  });
  it('Center Back', () => {
    expect(calcIdealWeight(180, Position.CenterBack)).toEqual({ min: 75, max: 82 });
  });
  it('Full Back', () => {
    expect(calcIdealWeight(180, Position.FullBack)).toEqual({ min: 75, max: 80 });
  });
  it('Midfielder', () => {
    expect(calcIdealWeight(180, Position.Midfielder)).toEqual({ min: 75, max: 80 });
  });
  it('Striker', () => {
    expect(calcIdealWeight(180, Position.Striker)).toEqual({ min: 75, max: 83 });
  });
  it('Winger', () => {
    expect(calcIdealWeight(180, Position.Winger)).toEqual({ min: 73, max: 80 });
  });
});

describe('calcProtein', () => {
  it('age 9', () => {
    expect(calcProtein(50, 9)).toEqual({ min: 50, max: 60 });
  });
  it('age 12', () => {
    expect(calcProtein(50, 12)).toEqual({ min: 50, max: 60 });
  });
  it('age 13', () => {
    expect(calcProtein(50, 13)).toEqual({ min: 50, max: 70 });
  });
  it('age 18', () => {
    expect(calcProtein(50, 18)).toEqual({ min: 50, max: 70 });
  });
  it('age 19', () => {
    expect(calcProtein(50, 19)).toEqual({ min: 70, max: 80 });
  });
}); 