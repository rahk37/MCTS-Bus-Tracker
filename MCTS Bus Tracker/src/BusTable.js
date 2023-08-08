//Represents table row for bus data table
class BusDataTableRow extends React.Component {

    render(){
        return(
            <tr>
                <td>{this.props.data.vid}</td>
                <td>{this.props.data.rt}</td>
                <td>{this.props.data.lat}</td>
                <td>{this.props.data.lon}</td>
                <td>{this.props.data.spd}</td>
                <td>{this.props.data.tmstmp}</td>
            </tr>
        );
    }
}

//Represents entire bus data table
class BusDataTable extends React.Component {

    constructor(props) {
        super(props);
    }


    render() {
        const tableRows = this.props.results.map((entry) =>
            (<BusDataTableRow
                data = {entry}
            />)
        );
        return (
            <table className="table table-bordered table-striped  mt-3">
                <thead className="thead-dark">
                <tr>
                    <th className="firstcol">Bus</th>
                    <th>Route</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Speed (mph)</th>
                    <th>Time Stamp</th>
                </tr>
                </thead>
                <tbody>
                {tableRows}
                </tbody>
            </table>
        );
    }
}