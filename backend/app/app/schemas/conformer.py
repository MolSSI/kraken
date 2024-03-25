from typing import List

from pydantic import BaseModel


class Atom(BaseModel):
    x: float
    y: float
    z: float
    symbol: str


class Conformer(BaseModel):
    id: int | str
    coords: List[Atom]
    property: float
