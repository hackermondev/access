import React from 'react';

import {Link as RouterLink, useSearchParams, useNavigate} from 'react-router-dom';
import Link from '@mui/material/Link';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import SellIcon from '@mui/icons-material/Sell';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {useCurrentUser} from '../../authentication';
import CreateUpdateGroup from '../groups/CreateUpdate';
import {useGetRoles} from '../../api/apiComponents';
import TablePaginationActions from '../../components/actions/TablePaginationActions';

export default function ListRoles() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState('');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  React.useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? null);
    if (searchInput == '') {
      setSearchInput(searchParams.get('q') ?? '');
    }
    setPage(parseInt(searchParams.get('page') ?? '0', 10));
    setRowsPerPage(parseInt(searchParams.get('per_page') ?? '20', 10));
  }, [searchParams]);

  const {data, error, isLoading} = useGetRoles({
    queryParams: Object.assign({page: page, per_page: rowsPerPage}, searchQuery == null ? null : {q: searchQuery}),
  });

  const {data: searchData} = useGetRoles({
    queryParams: {page: 0, per_page: 10, q: searchInput},
  });

  const rows = data?.results ?? [];
  const totalRows = data?.total ?? 0;

  // If there's only one search result, just redirect to that role's page
  if (searchQuery != null && totalRows == 1) {
    navigate('/roles/' + rows[0].name, {
      replace: true,
    });
  }

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = rowsPerPage - rows.length;

  const searchRows = searchData?.results ?? [];

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setSearchParams((params) => {
      params.set('page', newPage.toString(10));
      return params;
    });
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchParams((params) => {
      params.set('page', '0');
      params.set('per_page', event.target.value);
      return params;
    });
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchSubmit = (event: React.SyntheticEvent, newValue: string | null) => {
    if (newValue == null) {
      setSearchParams((params) => {
        params.delete('q');
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.set('page', '0');
        params.set('q', newValue);
        return params;
      });
      setPage(0);
    }
    setSearchQuery(newValue);
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper}>
        <Table sx={{minWidth: 650}} size="small" aria-label="roles">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography component="h5" variant="h5" color="primary">
                  Roles
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Box>
                    <Button variant="contained" onClick={() => navigate('/tags/')} endIcon={<SellIcon />}>
                      Tags
                    </Button>
                  </Box>
                  <Box sx={{mx: 2, width: '210px'}}>
                    <CreateUpdateGroup defaultGroupType="role_group" currentUser={currentUser}></CreateUpdateGroup>
                  </Box>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    filterOptions={(x) => x}
                    options={searchRows.map((row) => row.name)}
                    onChange={handleSearchSubmit}
                    onInputChange={(event, newInputValue) => setSearchInput(newInputValue)}
                    defaultValue={searchQuery}
                    key={searchQuery}
                    renderInput={(params) => <TextField {...params} label={'Search' as any} />}
                  />
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    to={`/roles/${row.name}`}
                    sx={{textDecoration: 'none', color: 'inherit'}}
                    component={RouterLink}>
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/roles/${row.name}`}
                    sx={{textDecoration: 'none', color: 'inherit'}}
                    component={RouterLink}>
                    {(row.description?.length ?? 0) > 115
                      ? row.description?.substring(0, 114) + '...' ?? ''
                      : row.description}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{height: 33 * emptyRows}}>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                colSpan={3}
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
}
